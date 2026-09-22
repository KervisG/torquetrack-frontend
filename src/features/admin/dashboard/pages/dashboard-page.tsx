import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api-client'
import { useAdminSession } from '@/features/admin/auth/hooks/use-admin-session'
import { hasAdminPermission } from '@/features/admin/auth/types'

import { getDashboard } from '../api'
import { dashboardKeys } from '../query-keys'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function DashboardPage() {
  const session = useAdminSession()
  const user = session.data?.user
  const allowed = user ? hasAdminPermission(user, 'dashboard.view') : false
  const dashboard = useQuery({
    queryKey: dashboardKeys.counts(),
    queryFn: getDashboard,
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have permission to view the dashboard.
        </p>
      </section>
    )
  }

  if (dashboard.isPending) {
    return <p className="text-muted-foreground">Loading dashboard…</p>
  }

  if (dashboard.error) {
    const message =
      dashboard.error instanceof ApiError
        ? dashboard.error.message
        : 'Could not load dashboard.'
    return <p className="text-destructive">{message}</p>
  }

  const counts = dashboard.data.counts

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Orders" value={String(counts.orders)} />
        <Metric label="Active quotes" value={String(counts.activeQuotes)} />
        <Metric label="Building quotes" value={String(counts.buildingQuotes)} />
        <Metric label="Active carts" value={String(counts.activeCarts)} />
        <Metric label="Abandoned carts" value={String(counts.abandonedCarts)} />
        <Metric label="Sales today" value={money.format(counts.salesToday)} />
      </ul>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{value}</p>
        </CardContent>
      </Card>
    </li>
  )
}
