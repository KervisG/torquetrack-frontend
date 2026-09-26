import { Navigate, useSearchParams } from 'react-router-dom'

const SECTIONS = ['profile', 'orders', 'quotes', 'tax-exemption']

// `/account?tab=<id>` era la URL del portal con pestañas y sigue en correos y
// favoritos: se traduce a la ruta de la sección.
export function PortalTabRedirect() {
  const [params] = useSearchParams()
  const tab = params.get('tab') ?? ''
  const section = SECTIONS.includes(tab) ? tab : 'profile'
  return <Navigate to={`/account/${section}`} replace />
}
