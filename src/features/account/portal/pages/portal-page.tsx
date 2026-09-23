import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { Card, CardContent } from '@/components/ui/card'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { ApiError } from '@/lib/api-client'

import { getAccount } from '../api'
import { OrdersPanel } from '../components/orders-panel'
import { PortalTabs } from '../components/portal-tabs'
import { ProfileForm } from '../components/profile-form'
import { QuotesPanel } from '../components/quotes-panel'
import { TaxExemptionForm } from '../components/tax-exemption-form'
import { VerifyEmailBanner } from '../components/verify-email-banner'
import { accountKeys } from '../query-keys'

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'tax-exemption', label: 'Tax exemption' },
] as const

type TabId = (typeof tabs)[number]['id']

function isTabId(value: string | null): value is TabId {
  return tabs.some((tab) => tab.id === value)
}

export function PortalPage() {
  const session = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const active: TabId = isTabId(requested) ? requested : 'profile'
  const account = useQuery({ queryKey: accountKeys.profile(), queryFn: getAccount })
  const sessionUser = session.data?.user

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">My account</h1>
      {sessionUser && !sessionUser.emailVerified ? (
        <div className="mt-4">
          <VerifyEmailBanner email={sessionUser.email} />
        </div>
      ) : null}
      <div className="mt-6">
        {account.isPending ? (
          <p className="text-sm text-muted-foreground">Loading account…</p>
        ) : account.error ? (
          <AccountError error={account.error} isStaff={Boolean(session.data?.user.isStaff)} />
        ) : (
          <>
            <PortalTabs
              tabs={tabs}
              active={active}
              onSelect={(id) => setSearchParams(id === 'profile' ? {} : { tab: id })}
            />
            <Card className="mt-4">
              <CardContent
                role="tabpanel"
                id={`panel-${active}`}
                aria-labelledby={`tab-${active}`}
                className="pt-6"
              >
                {active === 'profile' ? <ProfileForm profile={account.data} /> : null}
                {active === 'orders' ? <OrdersPanel /> : null}
                {active === 'quotes' ? <QuotesPanel /> : null}
                {active === 'tax-exemption' ? <TaxExemptionForm profile={account.data} /> : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
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
