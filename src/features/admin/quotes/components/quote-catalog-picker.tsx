import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Search, Tag, X } from 'lucide-react'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'

import { FormError } from '@/components/form-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  canonicalCategory,
  catalogCategories,
  productMatchesVinVehicle,
} from '@/features/storefront/catalog/filter-products'
import type { VinVehicle } from '@/features/storefront/catalog/types'
import { listAdminProducts } from '@/features/admin/products/api'
import type { AdminProduct } from '@/features/admin/products/types'
import { adminProductKeys } from '@/features/admin/products/query-keys'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { QuoteLineValues } from '@/lib/validators/admin-quote'

import type { QuoteVehicle } from '../types'

type QuoteCatalogPickerProps = {
  vehicle: QuoteVehicle
  canSearch: boolean
  onAdd: (line: QuoteLineValues) => void
}

type CategoryOption = { value: string; label: string }

// Flujo: primero se acota por categoría (chips), después se busca la pieza.
// Sin búsqueda ni chips la lista muestra todo el catálogo.
export function QuoteCatalogPicker({ vehicle, canSearch, onAdd }: QuoteCatalogPickerProps) {
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>([])
  const [lastAdded, setLastAdded] = useState('')
  const products = useQuery({
    queryKey: adminProductKeys.list(),
    queryFn: listAdminProducts,
    enabled: canSearch,
  })
  const vinVehicle: VinVehicle | null =
    vehicle.year || vehicle.make
      ? {
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
        }
      : null
  const categories = useMemo(
    () => catalogCategories((products.data ?? []).map((product) => product.category)),
    [products.data],
  )
  const matches = useMemo(() => {
    const chosen = new Set(selectedCategories.map((item) => canonicalCategory(item.value)))
    const vehicleFilter: VinVehicle | null =
      vehicle.year || vehicle.make
        ? {
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            engine: vehicle.engine,
          }
        : null
    return (products.data ?? [])
      .filter((product) => product.active !== false)
      .filter((product) => chosen.size === 0 || chosen.has(canonicalCategory(product.category)))
      .filter((product) => (vehicleFilter ? productMatchesVinVehicle(product, vehicleFilter) : true))
  }, [products.data, selectedCategories, vehicle])

  if (!canSearch) {
    return <p className="text-sm text-muted-foreground">Catalog search requires permission to view products.</p>
  }

  function add(product: AdminProduct) {
    const title = product.title || product.partNumber || product.id
    onAdd({
      productId: product.id,
      title,
      partNumber: product.partNumber || '',
      quantity: 1,
      unitPrice: product.price ?? 0,
      coreCharge: product.coreCharge ?? 0,
    })
    setLastAdded(title)
  }

  function toggleCategory(option: CategoryOption) {
    setSelectedCategories((current) =>
      current.some((item) => item.value === option.value)
        ? current.filter((item) => item.value !== option.value)
        : [...current, option],
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quote-category-search">1. Filter by category</Label>
        <CategoryCombobox
          id="quote-category-search"
          options={categories}
          selected={selectedCategories}
          onToggle={toggleCategory}
        />
        {selectedCategories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2" aria-label="Selected categories">
            {selectedCategories.map((item) => (
              <span
                key={item.value}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 py-1 pl-3 pr-1 text-xs font-medium text-amber-900"
              >
                {item.label}
                <button
                  type="button"
                  aria-label={`Remove ${item.label}`}
                  className="grid size-5 place-items-center rounded-full hover:bg-amber-200"
                  onClick={() => toggleCategory(item)}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setSelectedCategories([])}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-catalog-search">2. Search and pick a part</Label>
        <PartCombobox
          id="quote-catalog-search"
          matches={matches}
          loading={products.isPending}
          error={products.error}
          onPick={add}
        />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {lastAdded
            ? `Added ${lastAdded}. Search again to add another part.`
            : `${products.isPending ? 'Loading catalog…' : `${matches.length} ${matches.length === 1 ? 'part' : 'parts'} available`}${
                vinVehicle ? ` that fit ${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''
              }.`}
        </p>
      </div>
    </div>
  )
}

// Pocas sugerencias a la vez: para llegar a una pieza se sigue escribiendo.
const MAX_SUGGESTIONS = 8

// Buscador de piezas: las sugerencias aparecen solo en el desplegable, al
// enfocar o escribir, y elegir una la agrega a la cotización.
function PartCombobox({
  id,
  matches,
  loading,
  error,
  onPick,
}: {
  id: string
  matches: AdminProduct[]
  loading: boolean
  error: unknown
  onPick: (product: AdminProduct) => void
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const needle = text.trim().toLowerCase()
  const visible = matches.filter((product) => matchesSearch(product, needle)).slice(0, MAX_SUGGESTIONS)
  const total = needle ? matches.filter((product) => matchesSearch(product, needle)).length : matches.length

  function pick(product: AdminProduct) {
    onPick(product)
    setText('')
    setActive(0)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (visible.length ? (current + step + visible.length) % visible.length : 0))
    } else if (event.key === 'Enter') {
      // Enter elige la sugerencia marcada y no envía el formulario de la cotización.
      event.preventDefault()
      if (open && visible[active]) pick(visible[active])
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Name, part #, OEM #, brand, engine or fitment…"
        className="pl-9"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Loading catalog…</p>
          ) : error ? (
            <div className="px-3 py-2">
              <FormError error={error} />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matching parts. Try another word or remove a category.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Matching parts" className="py-1">
              {visible.map((product, index) => (
                <li
                  key={product.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                    index === active && 'bg-accent text-accent-foreground',
                  )}
                  // `mousedown` evita que el blur cierre la lista antes del click.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(product)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{product.title || product.partNumber}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[product.partNumber, product.category].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">{formatMoney(product.price ?? 0)}</span>
                    <Plus className="size-4 text-amber-600" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!loading && !error && total > visible.length ? (
            <p className="border-t bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              Showing {visible.length} of {total}. Keep typing to narrow it down.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// Buscador de categorías: se escribe, se elige una y queda como chip. Las ya
// elegidas se marcan y al volver a pulsarlas se quitan.
function CategoryCombobox({
  id,
  options,
  selected,
  onToggle,
}: {
  id: string
  options: CategoryOption[]
  selected: CategoryOption[]
  onToggle: (option: CategoryOption) => void
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const needle = text.trim().toLowerCase()
  const visible = options.filter((option) => option.label.toLowerCase().includes(needle))
  const isSelected = (option: CategoryOption) => selected.some((item) => item.value === option.value)

  function pick(option: CategoryOption) {
    onToggle(option)
    setText('')
    setActive(0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (visible.length ? (current + step + visible.length) % visible.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && visible[active]) pick(visible[active])
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Tag
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search a category and pick it…"
        className="pl-9"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          {visible.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No categories found.</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Categories" className="max-h-60 overflow-y-auto py-1">
              {visible.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected(option)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm',
                    index === active && 'bg-accent text-accent-foreground',
                  )}
                  // `mousedown` evita que el blur cierre la lista antes del click.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                >
                  {option.label}
                  {isSelected(option) ? <Check className="size-4 text-amber-600" aria-hidden="true" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

// Los números de parte se escriben con o sin guiones, puntos o espacios.
const compact = (value: string) => value.replace(/[\s\-./]/g, '')

// Cada palabra buscada tiene que aparecer en algún dato de la pieza: nombre,
// números de parte (propio, OEM, aftermarket, reman, proveedor), marca,
// vehículo, motor, categoría o compatibilidad.
function matchesSearch(product: AdminProduct, needle: string): boolean {
  if (!needle) return true
  const haystack = [
    product.title,
    product.partNumber,
    product.oemPart,
    product.aftermarketPart,
    product.remanPart,
    product.supplierPartNumber,
    product.manufacturer,
    product.make,
    product.model,
    product.engine,
    product.engineFamily,
    product.engineCode,
    product.category,
    product.fitment,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()
  const compactHaystack = compact(haystack)
  return needle
    .split(/\s+/)
    .every((word) => haystack.includes(word) || compactHaystack.includes(compact(word)))
}
