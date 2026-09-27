import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'

import { productFitmentLabel, type AdminProduct } from '../types'
import { ProductStatusSelect } from './product-status-select'

type ProductsTableProps = {
  products: AdminProduct[]
  canEdit: boolean
  onEdit: (product: AdminProduct) => void
  onDeactivate: (product: AdminProduct) => void
  onActivate: (product: AdminProduct) => void
  deactivatingId: string | null
  activatingId: string | null
}

export function ProductsTable({
  products,
  canEdit,
  onEdit,
  onDeactivate,
  onActivate,
  deactivatingId,
  activatingId,
}: ProductsTableProps) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">No products found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
      <table aria-label="Products" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Part</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Fitment</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canEdit ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
              <td className="px-4 py-4">
                <p className="font-medium">{product.title || product.id}</p>
                <p className="text-muted-foreground">{product.partNumber || '—'}</p>
              </td>
              <td className="px-4 py-4">{product.category || '—'}</td>
              <td className="px-4 py-4">{productFitmentLabel(product) || '—'}</td>
              <td className="px-4 py-4 text-right">{formatMoney(product.price ?? 0)}</td>
              <td className="px-4 py-4">
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
              </td>
              {canEdit ? (
                <td className="px-4 py-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)}>
                    Edit
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
