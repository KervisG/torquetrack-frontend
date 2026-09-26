import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  canonicalCategory,
  catalogCategories,
  productMatchesVinVehicle,
} from '@/features/storefront/catalog/filter-products'
import type { VinVehicle } from '@/features/storefront/catalog/types'
import { listAdminProducts } from '@/features/admin/products/api'
import { adminProductKeys } from '@/features/admin/products/query-keys'
import { formatMoney } from '@/lib/money'
import type { QuoteLineValues } from '@/lib/validators/admin-quote'

import type { QuoteVehicle } from '../types'

type QuoteCatalogPickerProps = {
  vehicle: QuoteVehicle
  canSearch: boolean
  onAdd: (line: QuoteLineValues) => void
}

export function QuoteCatalogPicker({ vehicle, canSearch, onAdd }: QuoteCatalogPickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
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
    () => catalogCategories(products.data ?? []),
    [products.data],
  )
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
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
      .filter((product) => category === 'All' || canonicalCategory(product.category) === canonicalCategory(category))
      .filter((product) => (vehicleFilter ? productMatchesVinVehicle(product, vehicleFilter) : true))
      .filter((product) => {
        if (!needle) return true
        return [product.title, product.partNumber, product.fitment, product.make, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle))
      })
      .slice(0, 8)
  }, [products.data, query, category, vehicle])

  if (!canSearch) {
    return <p className="text-sm text-muted-foreground">Catalog search requires permission to view products.</p>
  }

  return (
    <div className="space-y-3">
      <FormField
        id="quote-catalog-search"
        label="Search catalog"
        placeholder="Title, part number or fitment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex flex-wrap gap-2" aria-label="Categories">
        <Button type="button" size="sm" variant={category === 'All' ? 'default' : 'outline'} onClick={() => setCategory('All')}>
          All
        </Button>
        {categories.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={category === item.value ? 'default' : 'outline'}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {vinVehicle ? (
        <p className="text-sm text-muted-foreground">
          Showing parts that fit {vehicle.year} {vehicle.make} {vehicle.model}.
        </p>
      ) : null}
      {products.isPending ? (
        <p className="text-sm text-muted-foreground">Loading catalog…</p>
      ) : products.error ? (
        <FormError error={products.error} />
      ) : matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching parts.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {matches.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                <span className="font-medium">{product.title || product.partNumber}</span>
                <span className="ml-2 text-muted-foreground">{formatMoney(product.price ?? 0)}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onAdd({
                    productId: product.id,
                    title: product.title || product.partNumber || product.id,
                    partNumber: product.partNumber || '',
                    quantity: 1,
                    unitPrice: product.price ?? 0,
                    coreCharge: product.coreCharge ?? 0,
                  })
                }
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
