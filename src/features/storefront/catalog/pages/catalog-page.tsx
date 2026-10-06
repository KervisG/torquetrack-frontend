import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { trackSearch } from '@/lib/analytics'
import { ApiError } from '@/lib/api-client'
import { formatMoney, hasListedPrice } from '@/lib/money'
import { SITE_NAME, usePageMeta } from '@/lib/page-meta'
import { describeVehicle, useVehicleStore } from '@/stores/vehicle-store'

import { listProducts } from '../api'
import { HomeHero } from '../components/home-hero'
import { CategoryPicker } from '../components/category-picker'
import { PriceRange } from '../components/price-range'
import { ProductPhoto } from '../components/product-photo'
import { catalogBrands, catalogCategories, catalogConditions, filterProducts } from '../filter-products'
import { useMediaQuery } from '../hooks/use-media-query'
import { catalogReturnState, productPath } from '../product-path'
import { catalogKeys } from '../query-keys'

// Cuatro columnas por cuatro filas. El resto pasa a la página siguiente.
const PAGE_SIZE = 16

// Se espera a que el comprador deje de tipear antes de contar una búsqueda.
const SEARCH_TRACK_DELAY_MS = 800

// Mismo corte que `lg:` de Tailwind: desde ahí los filtros van en la columna.
const DESKTOP_QUERY = '(min-width: 1024px)'

export function CatalogPage() {
  // Filtros, búsqueda, orden y página viven en la URL: el botón atrás y un
  // enlace compartido conservan el contexto. Un valor por defecto no se escribe.
  const [params, setParams] = useSearchParams()
  const brand = params.get('brand') ?? ''
  const category = params.get('category') || 'All'
  const query = params.get('q') ?? ''
  const condition = params.get('condition') ?? ''
  const sort = params.get('sort') || 'featured'
  const minParam = params.get('min')
  const maxParam = params.get('max')
  const currentPage = Math.max(1, Math.trunc(Number(params.get('page'))) || 1)
  const vehicle = useVehicleStore((state) => state.vehicle)
  const clearVehicle = useVehicleStore((state) => state.clearVehicle)
  const setSelectorOpen = useVehicleStore((state) => state.setSelectorOpen)
  // Con un vehículo guardado se muestran solo las piezas que le van, salvo
  // que el comprador pida ver todo (`fit=all`).
  const fitOnly = Boolean(vehicle) && params.get('fit') !== 'all'
  const fitVehicle = fitOnly ? vehicle : null
  const resultsRef = useRef<HTMLElement>(null)
  // Los filtros se montan en un solo lugar (columna o panel) para no duplicar
  // ids de los campos. Sin matchMedia se asume escritorio.
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })

  // Los filtros cambian la lista, no la página: el canonical sigue siendo `/`.
  usePageMeta({
    title: `${SITE_NAME} – Diesel Injectors, Pumps & Parts`,
    fullTitle: true,
    description:
      'Shop diesel fuel injectors, injection pumps and engine parts by part number or vehicle. Fitment checked by VIN at checkout. Ships across the US.',
    canonicalPath: '/',
    type: 'website',
  })

  useEffect(() => {
    const term = query.trim()
    if (!term) return
    const timer = setTimeout(() => trackSearch(term), SEARCH_TRACK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])

  const brands = useMemo(() => catalogBrands(products.data || []), [products.data])
  const categories = useMemo(() => catalogCategories(products.data || []), [products.data])
  const conditions = useMemo(() => catalogConditions(products.data || []), [products.data])
  // El tope sale del catálogo completo (`/api/products/` no pagina), nunca de
  // la página visible.
  const priceCeiling = useMemo(() => {
    const prices = (products.data || []).map((product) => Number(product.price || 0))
    return Math.ceil(Math.max(0, ...prices))
  }, [products.data])
  const minPrice = minParam ?? ''
  const maxPrice = maxParam ?? ''
  const priceFiltered = Boolean(minPrice.trim() || maxPrice.trim())
  const activeFilterCount = [brand, category !== 'All', query.trim(), condition, priceFiltered].filter(
    Boolean,
  ).length

  const rows = useMemo(() => {
    const filtered = filterProducts(products.data || [], {
      brand,
      category,
      query,
      minPrice,
      maxPrice,
      condition,
      vehicle: fitVehicle,
    })
    if (sort === 'low') return [...filtered].sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'high') return [...filtered].sort((a, b) => Number(b.price) - Number(a.price))
    return filtered
  }, [products.data, brand, category, query, minPrice, maxPrice, condition, fitVehicle, sort])

  // Los enlaces a la ficha llevan la query string actual para el "Back to Store".
  const returnState = catalogReturnState(params.toString())

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Cambiar un filtro vuelve a la primera página. Lo que se tipea o se
  // arrastra reemplaza la entrada del historial en lugar de sumar una por tecla.
  function updateParams(
    patch: Record<string, string | null>,
    { replace = false, keepPage = false } = {},
  ) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        if (!keepPage) next.delete('page')
        return next
      },
      { replace },
    )
  }

  function goToPage(next: number) {
    updateParams({ page: next > 1 ? String(next) : null }, { keepPage: true })
    // jsdom no implementa el desplazamiento; en el navegador sube al listado.
    try {
      resultsRef.current?.scrollIntoView({ block: 'start' })
    } catch {
      // Sin desplazamiento el cambio de página igual se ve.
    }
  }

  // El diálogo del vehículo no se abre encima del panel de filtros.
  function openVehicleSelector() {
    setFiltersOpen(false)
    setSelectorOpen(true)
  }

  const filters = (
    <>
      <FilterGroup title="My vehicle">
        {vehicle ? (
          <>
            <p className="text-sm font-medium">{describeVehicle(vehicle)}</p>
            <div className="flex gap-3">
              <StorefrontButton
                type="button"
                tone="link"
                className="h-auto p-0"
                onClick={openVehicleSelector}
              >
                Change
              </StorefrontButton>
              <StorefrontButton
                type="button"
                tone="danger"
                className="h-auto p-0"
                onClick={() => {
                  clearVehicle()
                  updateParams({ fit: null })
                }}
              >
                Clear
              </StorefrontButton>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-amber-500"
                checked={fitOnly}
                onChange={(event) => updateParams({ fit: event.target.checked ? null : 'all' })}
              />
              Only show parts that fit
            </label>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Save your truck to see only the parts that fit it.
            </p>
            <StorefrontButton type="button" className="w-full" onClick={openVehicleSelector}>
              Select vehicle
            </StorefrontButton>
          </>
        )}
      </FilterGroup>
      <FilterGroup title="Search">
        <FormField
          id="part-search"
          label="Search"
          labelClassName="sr-only"
          type="search"
          value={query}
          onChange={(event) => updateParams({ q: event.target.value }, { replace: true })}
          placeholder="Part name, OEM # or aftermarket #"
        />
      </FilterGroup>
      <FilterGroup title="Brand">
        <select
          aria-label="Brand"
          value={brand}
          onChange={(event) => updateParams({ brand: event.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All brands</option>
          {brands.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup title="Category">
        <CategoryPicker
          categories={categories}
          value={category}
          onChange={(next) => updateParams({ category: next === 'All' ? null : next })}
        />
      </FilterGroup>
      <FilterGroup title="Condition">
        <select
          aria-label="Condition"
          value={condition}
          onChange={(event) => updateParams({ condition: event.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All conditions</option>
          {conditions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup title="Price">
        <PriceRange
          ceiling={priceCeiling}
          min={minPrice}
          max={maxPrice}
          onChange={({ min, max }) => updateParams({ min, max }, { replace: true })}
        />
      </FilterGroup>
    </>
  )

  return (
    <main>
      <HomeHero />
      <div className="flex flex-col gap-6 py-6 pl-4 pr-4 lg:flex-row lg:items-start lg:py-8 lg:pl-6 lg:pr-8">
        {isDesktop ? (
          <aside className="w-72 shrink-0 space-y-6 lg:sticky lg:top-20">{filters}</aside>
        ) : null}

        <section ref={resultsRef} className="min-w-0 flex-1 scroll-mt-20">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {products.isPending ? (
                <span className="inline-block h-4 w-28 animate-pulse rounded-md bg-muted align-middle" />
              ) : (
                resultLabel(rows.length, safePage)
              )}
              {fitVehicle && !products.isPending ? ` that fit your ${describeVehicle(fitVehicle)}` : ''}
            </p>
            <div className="flex gap-2">
              {isDesktop ? null : (
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <StorefrontButton type="button" tone="outline" className="shrink-0">
                      {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
                    </StorefrontButton>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex flex-col gap-0 overflow-y-auto p-0">
                    <SheetHeader className="border-b px-4 py-4 text-left">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription className="sr-only">
                        Narrow the parts list by vehicle, brand, category, condition and price.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 space-y-6 px-4 py-4">{filters}</div>
                    <SheetFooter className="sticky bottom-0 border-t bg-background px-4 py-3">
                      <StorefrontButton
                        type="button"
                        className="w-full"
                        onClick={() => setFiltersOpen(false)}
                      >
                        {products.isPending
                          ? 'Show parts'
                          : `Show ${rows.length} ${rows.length === 1 ? 'result' : 'results'}`}
                      </StorefrontButton>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              )}
              <Select
                value={sort}
                onValueChange={(next) => updateParams({ sort: next === 'featured' ? null : next })}
              >
                <SelectTrigger aria-label="Sort" className="w-full bg-background sm:w-52">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="low">Price: Low to High</SelectItem>
                  <SelectItem value="high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {products.isPending ? (
            <ProductGridSkeleton />
          ) : products.isError ? null : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts match these filters.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pageRows.map((product) => (
                <li key={product.id} className="flex h-full flex-col overflow-hidden rounded-md border bg-background">
                  <Link
                    to={productPath(product)}
                    state={returnState}
                    className="block h-40 bg-neutral-200"
                  >
                    <ProductPhoto
                      src={product.image}
                      partNumber={product.partNumber}
                      category={product.category}
                      brand={product.manufacturer}
                      className="h-full w-full object-contain"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    {product.condition ? (
                      <p className="mb-2 w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {product.condition}
                      </p>
                    ) : null}
                    <Link
                      to={productPath(product)}
                      state={returnState}
                      className="line-clamp-2 text-sm font-medium text-sky-900 hover:text-amber-700 hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Part # {product.partNumber || '—'}
                    </p>
                    <p className="mt-auto pt-3 text-xl">
                      {hasListedPrice(product.price) ? formatMoney(product.price) : 'Price on request'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 ? (
            <nav aria-label="Results pages" className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="h-9 rounded-md border bg-background px-3 text-sm disabled:opacity-40"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
              >
                Previous
              </button>
              {visiblePages(safePage, pageCount).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-current={number === safePage ? 'page' : undefined}
                  className={
                    number === safePage
                      ? 'h-9 min-w-9 rounded-md bg-neutral-950 px-3 text-sm text-white'
                      : 'h-9 min-w-9 rounded-md border bg-background px-3 text-sm'
                  }
                  onClick={() => goToPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className="h-9 rounded-md border bg-background px-3 text-sm disabled:opacity-40"
                disabled={safePage === pageCount}
                onClick={() => goToPage(safePage + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}

          {products.error ? (
            <p className="mt-4 text-sm text-destructive">
              {products.error instanceof ApiError
                ? products.error.message
                : 'Could not load products.'}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  )
}

// Mismo layout que la grilla real para que la página no salte al cargar.
function ProductGridSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading parts"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex h-full flex-col overflow-hidden rounded-md border bg-background">
          <Skeleton className="h-40 rounded-none" />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-6 w-20" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function resultLabel(total: number, page: number) {
  if (total <= PAGE_SIZE) return `${total} ${total === 1 ? 'result' : 'results'}`
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(total, page * PAGE_SIZE)
  return `${start}–${end} of ${total} results`
}

function visiblePages(current: number, count: number) {
  const end = Math.min(count, Math.max(current + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold">{title}</h2>
      {children}
    </div>
  )
}
