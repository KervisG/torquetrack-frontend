import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/stores/cart-store'

export function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id')
  const clear = useCartStore((state) => state.clear)

  useEffect(() => {
    clear()
  }, [clear])

  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Order received</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your secure payment was submitted. TorqueTrack will show the final payment status once
            the payment provider confirms it.
          </p>
          {orderId ? <p className="mt-4 font-medium">Order reference: {orderId}</p> : null}
          <StorefrontButton asChild className="mt-6">
            <Link to="/">Back to Store</Link>
          </StorefrontButton>
        </CardContent>
      </Card>
    </main>
  )
}
