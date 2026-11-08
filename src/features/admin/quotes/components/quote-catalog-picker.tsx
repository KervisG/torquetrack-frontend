import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Search, Tag, X } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { FormError } from '@/components/form-error'
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

// Una sugerencia del desplegable: una categoría (filtra) o una pieza (se agrega).
type Suggestion =
  | { kind: 'category'; option: CategoryOption }
  | { kind: 'part'; product: AdminProduct }

// Pocas sugerencias a la vez: para llegar a una pieza se sigue escribiendo.
const MAX_CATEGORIES = 4
const MAX_PARTS = 8

// Un solo buscador: las categorías elegidas quedan como chips dentro del
// campo y acotan las piezas; elegir una pieza la agrega a la cotización.
export function QuoteCatalogPicker({ vehicle, canSearch, onAdd }: QuoteCatalogPickerProps) {
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>([])
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [lastAdded, setLastAdded] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
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
  const available = useMemo(() => {
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

  const needle = text.trim().toLowerCase()
  const isSelected = (option: CategoryOption) => selectedCategories.some((item) => item.value === option.value)
  // Las categorías solo se sugieren al escribir: con el campo vacío manda la lista de piezas.
  const categoryHits = needle
    ? categories.filter((option) => option.label.toLowerCase().includes(needle)).slice(0, MAX_CATEGORIES)
    : []
  const partMatches = available.filter((product) => matchesSearch(product, needle))
  const partHits = partMatches.slice(0, MAX_PARTS)
  const suggestions: Suggestion[] = [
    ...categoryHits.map((option) => ({ kind: 'category' as const, option })),
    ...partHits.map((product) => ({ kind: 'part' as const, product })),
  ]

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
    setOpen(false)
  }

  function toggleCategory(option: CategoryOption) {
    setSelectedCategories((current) =>
      current.some((item) => item.value === option.value)
        ? current.filter((item) => item.value !== option.value)
        : [...current, option],
    )
  }

  function pick(suggestion: Suggestion) {
    if (suggestion.kind === 'category') toggleCategory(suggestion.option)
    else add(suggestion.product)
    setText('')
    setActive(0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) =>
        suggestions.length ? (current + step + suggestions.length) % suggestions.length : 0,
      )
    } else if (event.key === 'Enter') {
      // Enter elige la sugerencia marcada y no envía el formulario de la cotización.
      event.preventDefault()
      if (open && suggestions[active]) pick(suggestions[active])
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Backspace' && text === '' && selectedCategories.length > 0) {
      // Con el campo vacío, borrar quita el último chip.
      setSelectedCategories((current) => current.slice(0, -1))
    }
  }

  const optionId = (index: number) => `${listId}-${index}`

  return (
    <div className="space-y-2">
      <Label htmlFor="quote-catalog-search">Search parts or categories</Label>
      <div className="relative">
        {/* Click en cualquier parte del recuadro enfoca el campo. */}
        <div
          className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onMouseDown={(event) => {
            if (event.target !== inputRef.current) {
              event.preventDefault()
              inputRef.current?.focus()
            }
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {selectedCategories.map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-amber-900"
            >
              {item.label}
              <button
                type="button"
                aria-label={`Remove ${item.label}`}
                className="grid size-4 place-items-center rounded-full hover:bg-amber-200"
                onClick={() => toggleCategory(item)}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id="quote-catalog-search"
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && suggestions[active] ? optionId(active) : undefined}
            autoComplete="off"
            placeholder={
              selectedCategories.length
                ? 'Search in these categories…'
                : 'Part name, part #, OEM #, brand or category…'
            }
            className="min-w-40 flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
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
        </div>
        {open ? (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            {products.isPending ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Loading catalog…</p>
            ) : products.error ? (
              <div className="px-3 py-2">
                <FormError error={products.error} />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No matching parts. Try another word or remove a category.
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label="Suggestions" className="py-1">
                {categoryHits.length ? <GroupLabel>Filter by category</GroupLabel> : null}
                {categoryHits.map((option, index) => (
                  <li
                    key={`category-${option.value}`}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    className={optionClass(index === active)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick({ kind: 'category', option })}
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
                      {option.label}
                    </span>
                    {isSelected(option) ? (
                      <Check className="size-4 text-amber-600" aria-hidden="true" />
                    ) : null}
                  </li>
                ))}
                {partHits.length ? <GroupLabel>Parts</GroupLabel> : null}
                {partHits.map((product, partIndex) => {
                  const index = categoryHits.length + partIndex
                  return (
                    <li
                      key={product.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={index === active}
                      className={optionClass(index === active)}
                      // `mousedown` evita que el blur cierre la lista antes del click.
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick({ kind: 'part', product })}
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
                  )
                })}
              </ul>
            )}
            {!products.isPending && !products.error && partMatches.length > partHits.length ? (
              <p className="border-t bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                Showing {partHits.length} of {partMatches.length} parts. Keep typing to narrow it down.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {lastAdded
          ? `Added ${lastAdded}. Search again to add another part.`
          : `${products.isPending ? 'Loading catalog…' : `${available.length} ${available.length === 1 ? 'part' : 'parts'} available`}${
              vinVehicle ? ` that fit ${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''
            }. Pick a category to filter, or a part to add it.`}
      </p>
    </div>
  )
}

function GroupLabel({ children }: { children: string }) {
  return (
    <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </li>
  )
}

const optionClass = (active: boolean) =>
  cn(
    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
    active && 'bg-accent text-accent-foreground',
  )

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
