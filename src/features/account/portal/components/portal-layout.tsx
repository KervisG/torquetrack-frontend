import { Link, Outlet } from 'react-router-dom'

import { PageHeader } from '@/components/app-shell/page-header'
import { FormError } from '@/components/form-error'
import { Card, CardContent } from '@/components/ui/card'
import { PanelShell } from '@/features/account/auth/components/panel-shell'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { ApiError } from '@/lib/api-client'

import { useAccount } from '../hooks/use-account'
import { VerifyEmailBanner } from './verify-email-banner'

// `AccountAuthGuard` ya resolvió la sesión. Las secciones leen el perfil del
// mismo cache, así que solo se renderizan cuando ya cargó.
export function PortalLayout() {
  const session = useSession()
  const account = useAccount()
  const user = session.data?.user
  if (!user) return null

  return (
    <PanelShell user={user}>
      {!user.emailVerified ? (
        <div className="mb-6">
          <VerifyEmailBanner email={user.email} />
        </div>
      ) : null}
      {account.isPending ? (
        <p className="text-sm text-muted-foreground">Loading account…</p>
      ) : account.error ? (
        <section>
          <PageHeader title="My account" />
          <Card>
            <CardContent className="pt-6">
              <AccountError error={account.error} isStaff={user.isStaff} />
            </CardContent>
          </Card>
        </section>
      ) : (
        <Outlet />
      )}
    </PanelShell>
  )
}

// Un 404 es una cuenta sin `Customer` vinculado, típicamente staff creado
// desde el panel: no es un fallo, así que se explica en lugar de mostrar el error.
function AccountError({ error, isStaff }: { error: unknown; isStaff: boolean }) {
  if (!(error instanceof ApiError) || error.status !== 404) {
    return <FormError error={error} />
  }

  return (
    <div className="space-y-2 text-sm">
      <p>This account does not have a customer profile.</p>
      {isStaff ? (
        <Link to="/admin" className="underline">
          Go to the admin panel
        </Link>
      ) : (
        <p className="text-muted-foreground">Contact TorqueTrack to link your customer record.</p>
      )}
    </div>
  )
}
