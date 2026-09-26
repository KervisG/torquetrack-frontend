import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/lib/api-client'
import { formatMoney, hasListedPrice } from '@/lib/money'

import { listProducts } from '../api'
import { HomeHero } from '../components/home-hero'
import { CategoryPicker } from '../components/category-picker'
import { PriceRange } from '../components/price-range'
import { ProductPhoto } from '../components/product-photo'
import { catalogBrands, catalogCategories, catalogConditions, filterProducts } from '../filter-products'
import { catalogKeys } from '../query-keys'
import type { VinVehicle } from '../types'
import { decodeVin } from '../../vin/api'

// Cuatro columnas por cuatro filas. El resto pasa a la página siguiente.
const PAGE_SIZE = 16

export function CatalogPage() {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [condition, setCondition] = useState('')
  const [sort, setSort] = useState('featured')
  const [vin, setVin] = useState('')
  const [vehicle, setVehicle] = useState<VinVehicle | null>(null)
  const [vinError, setVinError] = useState('')
  const [page, setPage] = useState(1)
  const resultsRef = useRef<HTMLElement>(null)
  const minPrice = priceRange ? String(priceRange[0]) : ''
  const maxPrice = priceRange ? String(priceRange[1]) : ''
  const filterKey = [brand, category, query, minPrice, maxPrice, condition, sort, vehicle?.vin ?? ''].join('|')
  const [seenFilter, setSeenFilter] = useState(filterKey)
  // Al cambiar búsqueda o filtros se vuelve a la primera página en este render,
  // antes de recortar la lista.
  let currentPage = page
  if (seenFilter !== filterKey) {
    setSeenFilter(filterKey)
    setPage(1)
    currentPage = 1
  }
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })

  const brands = useMemo(() => catalogBrands(products.data || []), [products.data])
  const categories = useMemo(() => catalogCategories(products.data || []), [products.data])
  const conditions = useMemo(() => catalogConditions(products.data || []), [products.data])
  const priceCeiling = useMemo(() => {
    const prices = (products.data || []).map((product) => Number(product.price || 0))
    return Math.ceil(Math.max(0, ...prices))
  }, [products.data])

  const rows = useMemo(() => {
    const filtered = filterProducts(products.data || [], {
      brand,
      category,
      query,
      minPrice,
      maxPrice,
      condition,
      vehicle,
    })
    if (sort === 'low') return [...filtered].sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'high') return [...filtered].sort((a, b) => Number(b.price) - Number(a.price))
    return filtered
  }, [products.data, brand, category, query, minPrice, maxPrice, condition, vehicle, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function goToPage(next: number) {
    setPage(next)
    // jsdom no implementa el desplazamiento; en el navegador sube al listado.
    try {
      resultsRef.current?.scrollIntoView({ block: 'start' })
    } catch {
      // Sin desplazamiento el cambio de página igual se ve.
    }
  }

  async function onVinSearch() {
    setVinError('')
    try {
      const result = await decodeVin(vin.trim().toUpperCase())
      setVehicle({ ...result.vehicle, vin: vin.trim().toUpperCase() })
    } catch (error) {
      setVehicle(null)
      setVinError(error instanceof ApiError ? error.message : 'VIN lookup failed')
    }
  }

  return (
    <main>
      <HomeHero />
      <div className="flex flex-col gap-6 py-8 pl-4 pr-4 lg:flex-row lg:items-start lg:pl-6 lg:pr-8">
        <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-20 lg:w-72">
          <FilterGroup title="Search">
            <FormField
              id="part-search"
              label="Search"
              labelClassName="sr-only"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Part name, OEM # or aftermarket #"
            />
          </FilterGroup>
          <FilterGroup title="Brand">
            <select
              aria-label="Brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
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
            <CategoryPicker categories={categories} value={category} onChange={setCategory} />
          </FilterGroup>
          <FilterGroup title="Condition">
            <select
              aria-label="Condition"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
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
            <PriceRange ceiling={priceCeiling} value={priceRange} onChange={setPriceRange} />
          </FilterGroup>
          <FilterGroup title="VIN">
            {/* El botón va debajo: al lado recortaba los 17 caracteres del VIN. */}
            <FormField
              id="vin-lookup"
              label="VIN"
              labelClassName="sr-only"
              value={vin}
              onChange={(event) => setVin(event.target.value.toUpperCase())}
              maxLength={17}
              placeholder="17-character VIN"
              spellCheck={false}
              autoComplete="off"
              className="h-11 font-mono text-base tracking-wide md:text-base"
              error={vinError}
            />
            <StorefrontButton type="button" className="w-full" onClick={() => void onVinSearch()}>
              Apply
            </StorefrontButton>
            {vehicle ? (
              <p className="text-sm">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.engine ? ` · ${vehicle.engine}` : ''}
                <StorefrontButton
                  type="button"
                  tone="link"
                  className="ml-2 h-auto p-0"
                  onClick={() => {
                    setVehicle(null)
                    setVin('')
                  }}
                >
                  Clear VIN
                </StorefrontButton>
              </p>
            ) : null}
          </FilterGroup>
        </aside>

        <section ref={resultsRef} className="min-w-0 flex-1 scroll-mt-20">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {products.isPending ? 'Loading parts…' : resultLabel(rows.length, safePage)}
            </p>
            <Select value={sort} onValueChange={setSort}>
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

          {products.isError || products.isPending ? null : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts match these filters.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pageRows.map((product) => (
                <li key={product.id} className="flex h-full flex-col overflow-hidden rounded-md border bg-background">
                  <Link to={`/product/${product.id}`} className="block h-40 bg-neutral-200">
                    <ProductPhoto
                      src={product.image}
                      partNumber={product.partNumber}
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
                      to={`/product/${product.id}`}
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
