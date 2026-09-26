import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'

import type { AdminProduct } from '../types'

type ProductsTableProps = {
  products: AdminProduct[]
  canEdit: boolean
  onEdit: (product: AdminProduct) => void
  onDeactivate: (product: AdminProduct) => void
  deactivatingId: string | null
}

export function ProductsTable({
  products,
  canEdit,
  onEdit,
  onDeactivate,
  deactivatingId,
}: ProductsTableProps) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">No products found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table aria-label="Products" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Part</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium">Fitment</th>
            <th className="py-2 pr-4 text-right font-medium">Price</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {canEdit ? <th className="py-2 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <p className="font-medium">{product.title || product.id}</p>
                <p className="text-muted-foreground">{product.partNumber || '—'}</p>
              </td>
              <td className="py-2 pr-4">{product.category || '—'}</td>
              <td className="py-2 pr-4">
                {[product.yearFrom, product.yearTo].filter(Boolean).join('–') || '—'}
                {product.make ? ` ${product.make}` : ''}
              </td>
              <td className="py-2 pr-4 text-right">{formatMoney(product.price ?? 0)}</td>
              <td className="py-2 pr-4">
                <Badge variant={product.active ? 'secondary' : 'outline'}>
                  {product.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              {canEdit ? (
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)}>
                      Edit
                    </Button>
                    {product.active ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deactivatingId === product.id}
                        onClick={() => onDeactivate(product)}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
