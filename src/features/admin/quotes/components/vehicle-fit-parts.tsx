import { useQuery } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { listAdminProducts } from '@/features/admin/products/api'
import { adminProductKeys } from '@/features/admin/products/query-keys'
import type { AdminProduct } from '@/features/admin/products/types'
import { productMatchesVinVehicle } from '@/features/storefront/catalog/filter-products'
import { formatMoney } from '@/lib/money'
import type { QuoteLineValues } from '@/lib/validators/admin-quote'

import type { QuoteVehicle } from '../types'

type VehicleFitPartsProps = {
  vehicle: QuoteVehicle
  canSearch: boolean
  // Piezas que ya están en la cotización: se marcan en vez de duplicarse.
  addedIds: string[]
  onAdd: (line: QuoteLineValues) => void
}

const PREVIEW = 6

// Piezas del catálogo que le caben al vehículo, con la misma regla de
// compatibilidad que el buscador de la cotización. Comparte su cache.
export function VehicleFitParts({ vehicle, canSearch, addedIds, onAdd }: VehicleFitPartsProps) {
  const [expanded, setExpanded] = useState(false)
  const identified = Boolean(vehicle.year || vehicle.make)
  const products = useQuery({
    queryKey: adminProductKeys.list(),
    queryFn: listAdminProducts,
    enabled: canSearch && identified,
  })
  const fits = useMemo(
    () =>
      (products.data ?? []).filter(
        (product) => product.active !== false && productMatchesVinVehicle(product, vehicle),
      ),
    [products.data, vehicle],
  )

  if (!canSearch || !identified) return null

  const shown = expanded ? fits : fits.slice(0, PREVIEW)
  const added = new Set(addedIds)
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')

  return (
    <section aria-label="Parts that fit this vehicle" className="space-y-2">
      <h4 className="text-sm font-semibold">
        Parts in stock for {name}
        {products.data ? (
          <span className="ml-2 font-normal text-muted-foreground">({fits.length})</span>
        ) : null}
      </h4>
      {products.isPending ? (
        <p className="text-sm text-muted-foreground">Looking for matching parts…</p>
      ) : products.error ? (
        <FormError error={products.error} />
      ) : fits.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No catalog parts match this vehicle yet. You can still add items manually.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {shown.map((product) => (
            <PartRow
              key={product.id}
              product={product}
              added={added.has(product.id)}
              onAdd={() =>
                onAdd({
                  productId: product.id,
                  title: product.title || product.partNumber || product.id,
                  partNumber: product.partNumber || '',
                  quantity: 1,
                  unitPrice: product.price ?? 0,
                  coreCharge: product.coreCharge ?? 0,
                })
              }
            />
          ))}
        </ul>
      )}
      {fits.length > PREVIEW ? (
        <Button type="button" variant="link" className="h-auto p-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show all ${fits.length} parts`}
        </Button>
      ) : null}
    </section>
  )
}

function PartRow({
  product,
  added,
  onAdd,
}: {
  product: AdminProduct
  added: boolean
  onAdd: () => void
}) {
  const title = product.title || product.partNumber
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[product.partNumber, product.category].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="text-muted-foreground">{formatMoney(product.price ?? 0)}</span>
        {added ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Check className="size-4" aria-hidden="true" />
            Added
          </span>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onAdd} aria-label={`Add ${title}`}>
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Button>
        )}
      </span>
    </li>
  )
}
