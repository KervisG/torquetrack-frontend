import { Navigate, Outlet } from 'react-router-dom'

import { useAdminSession } from '../hooks/use-admin-session'

export function AdminGuestGuard() {
  const session = useAdminSession()

  if (session.data?.authenticated) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
