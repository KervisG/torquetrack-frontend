import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { NotFoundPage } from './not-found-page'

// Se muestra fuera del StorefrontShell porque el error puede venir del propio
// shell. Después de un deploy, abrir una página lazy puede fallar porque el
// chunk viejo ya no existe; recargar trae el index nuevo y lo resuelve.
export function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      {notFound ? (
        <NotFoundPage />
      ) : (
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We could not load this page. Try reloading it; if the problem continues, contact
                TorqueTrack support.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <StorefrontButton onClick={() => window.location.reload()}>Reload Page</StorefrontButton>
                {/* Enlace nativo: el router puede ser justamente lo que falló. */}
                <StorefrontButton asChild tone="outline">
                  <a href="/">Back to Store</a>
                </StorefrontButton>
              </div>
            </CardContent>
          </Card>
        </main>
      )}
    </div>
  )
}
