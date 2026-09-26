import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api-client'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { hasAdminPermission } from '@/features/admin/auth/types'

import { getDashboard } from '../api'
import { dashboardKeys } from '../query-keys'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function DashboardPage() {
  const session = useSession()
  const user = session.data?.user
  const allowed = user ? hasAdminPermission(user, 'dashboard.view') : false
  const dashboard = useQuery({
    queryKey: dashboardKeys.counts(),
    queryFn: getDashboard,
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <PermissionNotice title="Dashboard" message="You do not have permission to view the dashboard." />
    )
  }

  const header = <PageHeader title="Dashboard" description="Store activity at a glance." />

  if (dashboard.isPending) {
    return (
      <section>
        {header}
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </section>
    )
  }

  if (dashboard.error) {
    const message =
      dashboard.error instanceof ApiError
        ? dashboard.error.message
        : 'Could not load dashboard.'
    return (
      <section>
        {header}
        <p className="text-sm text-destructive">{message}</p>
      </section>
    )
  }

  const counts = dashboard.data.counts
  // Un conteo enlaza a su pantalla solo si el rol puede abrirla.
  const canOrders = user ? hasAdminPermission(user, 'orders.view') : false
  const canQuotes = user ? hasAdminPermission(user, 'quotes.view') : false
  const canCarts = user ? hasAdminPermission(user, 'carts.view') : false

  return (
    <section>
      {header}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Orders"
          value={String(counts.orders)}
          to={canOrders ? '/admin/orders' : undefined}
        />
        <Metric
          label="Active quotes"
          value={String(counts.activeQuotes)}
          to={canQuotes ? '/admin/quotes?status=ACTIVE' : undefined}
        />
        <Metric
          label="Building quotes"
          value={String(counts.buildingQuotes)}
          to={canQuotes ? '/admin/quotes?status=BUILDING' : undefined}
        />
        <Metric
          label="Active carts"
          value={String(counts.activeCarts)}
          to={canCarts ? '/admin/carts?status=ACTIVE' : undefined}
        />
        <Metric
          label="Abandoned carts"
          value={String(counts.abandonedCarts)}
          to={canCarts ? '/admin/carts?status=ABANDONED' : undefined}
        />
        <Metric label="Sales today" value={money.format(counts.salesToday)} />
      </ul>
    </section>
  )
}

function Metric({ label, value, to }: { label: string; value: string; to?: string }) {
  const card = (
    <Card className={to ? 'transition-colors hover:border-foreground/40' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )

  return <li>{to ? <Link to={to} className="block">{card}</Link> : card}</li>
}
