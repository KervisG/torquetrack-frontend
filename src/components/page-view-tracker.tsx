import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { trackPageView } from '@/lib/analytics'

// Layout raíz sin markup: manda un `page_view` por cada cambio de ruta del SPA.
// El efecto del padre corre después de los de la página, así que el título
// ya es el de la ruta nueva. `trackPageView` ignora el panel y el portal.
export function PageViewTracker() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    trackPageView(pathname, search)
  }, [pathname, search])

  return <Outlet />
}
