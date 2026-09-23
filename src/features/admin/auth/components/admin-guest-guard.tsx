import { Navigate, Outlet } from 'react-router-dom'

import { useAdminSession } from '../hooks/use-admin-session'

export function AdminGuestGuard() {
  const session = useAdminSession()

  // Solo el staff salta el login; un cliente con sesión puede entrar con
  // otra cuenta.
  if (session.data?.user.isStaff) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
