import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { StorefrontButton } from '@/components/storefront-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getProduct } from '@/features/storefront/catalog/api'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { ApiError } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { useCartStore } from '@/stores/cart-store'

export function ProductPage() {
  const { id = '' } = useParams()
  const add = useCartStore((state) => state.add)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const product = useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })

  if (product.isPending) {
    return <p className="px-4 py-16 text-center text-muted-foreground">Loading product…</p>
  }

  if (product.error) {
    return (
      <p className="px-4 py-16 text-center text-destructive">
        {product.error instanceof ApiError ? product.error.message : 'Unable to load products.'}
      </p>
    )
  }

  if (!product.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">We could not find this product.</p>
        <StorefrontButton asChild tone="link" className="mt-4">
          <Link to="/">← Back to Store</Link>
        </StorefrontButton>
      </main>
    )
  }

  const item = product.data

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2">
      <Card className="flex min-h-80 items-center justify-center bg-muted/40">
        <CardContent className="p-6">
          {item.image ? <img src={item.image} alt={item.title} className="max-h-80 object-contain" /> : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <StorefrontButton asChild tone="link" className="px-0">
            <Link to="/">← Back to Store</Link>
          </StorefrontButton>
          <Badge variant="secondary" className="mt-4">
            {item.category}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{item.title}</h1>
          <p className="mt-3 text-muted-foreground">{item.fitment}</p>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b py-2">
              <dt className="text-muted-foreground">OEM</dt>
              <dd>{item.oemPart || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b py-2">
              <dt className="text-muted-foreground">Part #</dt>
              <dd>{item.partNumber || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">Manufacturer</dt>
              <dd>{item.manufacturer || '—'}</dd>
            </div>
          </dl>
          <p className="mt-6 text-3xl font-semibold">{formatMoney(item.price)}</p>
          <StorefrontButton
            type="button"
            className="mt-6"
            onClick={() => {
              add(item.id)
              setDrawerOpen(true)
            }}
          >
            Add to Cart
          </StorefrontButton>
        </CardContent>
      </Card>
    </main>
  )
}
