import { FileText, Package, Receipt, UserRound } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

import { AppShell } from '@/components/app-shell/app-shell'
import { PageHeader } from '@/components/app-shell/page-header'
import type { ShellNavGroup } from '@/components/app-shell/sidebar-nav'
import { FormError } from '@/components/form-error'
import { Card, CardContent } from '@/components/ui/card'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { useSignOut } from '@/features/account/auth/hooks/use-sign-out'
import { displayName } from '@/features/account/auth/types'
import { ApiError } from '@/lib/api-client'

import { useAccount } from '../hooks/use-account'
import { VerifyEmailBanner } from './verify-email-banner'

const NAV_GROUPS: ShellNavGroup[] = [
  {
    label: 'My account',
    items: [
      { to: '/account/profile', label: 'Profile', icon: UserRound },
      { to: '/account/orders', label: 'Orders', icon: Package },
      { to: '/account/quotes', label: 'Quotes', icon: FileText },
      { to: '/account/tax-exemption', label: 'Tax exemption', icon: Receipt },
    ],
  },
]

// `AccountAuthGuard` ya resolvió la sesión. Las secciones leen el perfil del
// mismo cache, así que solo se renderizan cuando ya cargó.
export function PortalLayout() {
  const session = useSession()
  const signOut = useSignOut()
  const account = useAccount()
  const user = session.data?.user
  if (!user) return null

  return (
    <AppShell
      navLabel="Account"
      homeHref="/account"
      area="My account"
      groups={NAV_GROUPS}
      user={{
        name: displayName(user),
        email: user.email,
        role: user.isStaff ? (user.role?.name ?? 'Staff') : 'Customer',
      }}
      onSignOut={() => signOut.mutate()}
      signingOut={signOut.isPending}
      signOutError={signOut.error}
    >
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
    </AppShell>
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
