import { Navigate, Outlet } from 'react-router-dom'

import { useSession } from '../hooks/use-session'
import { SessionLoading } from './session-loading'

export function AccountAuthGuard() {
  const session = useSession()

  if (session.isPending) {
    return <SessionLoading />
  }

  if (!session.data) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
