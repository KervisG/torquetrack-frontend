import { Navigate, Outlet } from 'react-router-dom'

import { useAdminSession } from '../hooks/use-admin-session'
import { AdminShell } from './admin-shell'

export function AdminAuthGuard() {
  const session = useAdminSession()

  if (session.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading session…
      </main>
    )
  }

  if (!session.data) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminShell user={session.data.user}>
      <Outlet />
    </AdminShell>
  )
}
