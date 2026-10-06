import { Navigate, Outlet } from 'react-router-dom'

import { PanelShell } from '@/features/account/auth/components/panel-shell'
import { SessionLoading } from '@/features/account/auth/components/session-loading'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { homePathFor } from '@/features/account/auth/types'

export function AdminAuthGuard() {
  const session = useSession()

  if (session.isPending) {
    return <SessionLoading />
  }

  if (!session.data) {
    return <Navigate to="/login" replace />
  }

  // Una cuenta sin Role es un cliente: tiene sesión pero no panel, así que va
  // a su portal.
  if (!session.data.user.isStaff) {
    return <Navigate to={homePathFor(session.data.user)} replace />
  }

  return (
    <PanelShell user={session.data.user} wide>
      <Outlet />
    </PanelShell>
  )
}
