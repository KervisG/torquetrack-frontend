import { Navigate, Outlet } from 'react-router-dom'

import { useSession } from '../hooks/use-session'
import { homePathFor } from '../types'
import { SessionLoading } from './session-loading'

// Login y registro no tienen sentido con una sesión abierta: se manda a cada
// cuenta a su lugar de trabajo. Para cambiar de cuenta primero se sale.
export function GuestGuard() {
  const session = useSession()

  if (session.isPending) {
    return <SessionLoading />
  }

  if (session.data) {
    return <Navigate to={homePathFor(session.data.user)} replace />
  }

  return <Outlet />
}
