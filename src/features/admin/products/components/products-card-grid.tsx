import { Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'

import { productFitmentLabel, type AdminProduct } from '../types'
import { ProductStatusSelect } from './product-status-select'

type ProductsCardGridProps = {
  products: AdminProduct[]
  canEdit: boolean
  onEdit: (product: AdminProduct) => void
  onDeactivate: (product: AdminProduct) => void
  onActivate: (product: AdminProduct) => void
  deactivatingId: string | null
  activatingId: string | null
}

// placehold.co pinta un recuadro casi negro. Sin foto real se muestra el icono.
function isPlaceholder(src: string | undefined): boolean {
  return !src || src.includes('placehold.co')
}

export function ProductsCardGrid({
  products,
  canEdit,
  onEdit,
  onDeactivate,
  onActivate,
  deactivatingId,
  activatingId,
}: ProductsCardGridProps) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">No products found.</p>
  }

  return (
    <ul aria-label="Products" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const fitment = productFitmentLabel(product)
        const meta = [product.category, fitment].filter(Boolean).join(' · ')
        return (
          <li
            key={product.id}
            className="flex h-full flex-col overflow-hidden rounded-lg border border-foreground/15 bg-background"
          >
            <div className="h-36 shrink-0 overflow-hidden bg-muted">
              {isPlaceholder(product.image) ? (
                <div className="grid h-full place-items-center">
                  <Package className="size-8 text-muted-foreground" aria-hidden="true" />
                </div>
              ) : (
                // La foto no puede crecer con su tamaño real: si no, tapa el título.
                <img src={product.image} alt="" className="h-full w-full object-contain" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="space-y-1">
                <p className="line-clamp-2 font-medium">{product.title || product.id}</p>
                <p className="text-sm text-muted-foreground">{product.partNumber || '—'}</p>
              </div>
              {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
              <div className="mt-auto flex items-center justify-between gap-3">
                <p className="font-medium">{formatMoney(product.price ?? 0)}</p>
                {canEdit ? (
                  <ProductStatusSelect
                    product={product}
                    pending={deactivatingId === product.id || activatingId === product.id}
                    onActivate={onActivate}
                    onDeactivate={onDeactivate}
                  />
                ) : (
                  <Badge variant={product.active ? 'secondary' : 'outline'}>
                    {product.active ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
              {canEdit ? (
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onEdit(product)}>
                  Edit
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
