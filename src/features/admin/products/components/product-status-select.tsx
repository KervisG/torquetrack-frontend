import type { AdminProduct } from '../types'

export function ProductStatusSelect({
  product,
  pending,
  onActivate,
  onDeactivate,
}: {
  product: AdminProduct
  pending: boolean
  onActivate: (product: AdminProduct) => void
  onDeactivate: (product: AdminProduct) => void
}) {
  const label = product.title || product.partNumber || product.id

  return (
    <select
      aria-label={`Status for ${label}`}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      value={product.active ? 'active' : 'inactive'}
      disabled={pending}
      onChange={(event) => {
        if (event.target.value === 'active') onActivate(product)
        else onDeactivate(product)
      }}
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  )
}
