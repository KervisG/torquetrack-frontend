import { Link } from 'react-router-dom'

import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold tracking-[0.32em] text-amber-500">404</p>
          <CardTitle className="text-3xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <StorefrontButton asChild>
              <Link to="/">Back to Store</Link>
            </StorefrontButton>
            <StorefrontButton asChild tone="outline">
              <Link to="/quote">Request a Quote</Link>
            </StorefrontButton>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
