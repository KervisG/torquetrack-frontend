import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { Archive, DollarSign, FilePen, FileText, Package, Rocket, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/app-shell/page-header'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { getDashboard } from '../api'
import { AnalyticsSection } from '../components/analytics-section'
import { StatTile, StatTileSkeleton } from '../components/stat-tile'
import { dashboardKeys } from '../query-keys'
import type { DashboardResponse } from '../types'

export function DashboardPage() {
  const { can } = useAdminPermissions()
  const allowed = can('dashboard.view')
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

  return (
    <section className="space-y-8">
      <PageHeader title="Dashboard" description="Store activity at a glance." />
      <Counters
        query={dashboard}
        canOrders={can('orders.view')}
        canQuotes={can('quotes.view')}
        canCarts={can('carts.view')}
      />
      {dashboard.data && isEmptyStore(dashboard.data) ? (
        <GettingStarted
          canProducts={can('products.edit')}
          canQuotes={can('quotes.create')}
          canCustomers={can('customers.edit')}
        />
      ) : null}
      <AnalyticsSection />
    </section>
  )
}

// Sin pedidos ni cotizaciones la tienda recién arranca: se ofrecen los
// primeros pasos en lugar de una fila de ceros.
function isEmptyStore(data: DashboardResponse): boolean {
  const { orders, activeQuotes, buildingQuotes } = data.counts
  return orders === 0 && activeQuotes === 0 && buildingQuotes === 0
}

function GettingStarted({
  canProducts,
  canQuotes,
  canCustomers,
}: {
  canProducts: boolean
  canQuotes: boolean
  canCustomers: boolean
}) {
  if (!canProducts && !canQuotes && !canCustomers) return null
  return (
    <EmptyState
      icon={Rocket}
      title="No orders or quotes yet"
      description="Set up your catalog and customers to start quoting and selling."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {canProducts ? (
            <Button asChild>
              <Link to="/admin/products?new=1">Add your first product</Link>
            </Button>
          ) : null}
          {canQuotes ? (
            <Button asChild variant={canProducts ? 'outline' : 'default'}>
              <Link to="/admin/quotes?new=1">Create a quote</Link>
            </Button>
          ) : null}
          {canCustomers ? (
            <Button asChild variant={canProducts || canQuotes ? 'outline' : 'default'}>
              <Link to="/admin/customers?new=1">Add customer</Link>
            </Button>
          ) : null}
        </div>
      }
    />
  )
}

const COUNTERS_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6'

function Counters({
  query,
  canOrders,
  canQuotes,
  canCarts,
}: {
  query: UseQueryResult<DashboardResponse>
  canOrders: boolean
  canQuotes: boolean
  canCarts: boolean
}) {
  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p className="sr-only">Loading dashboard…</p>
        <ul className={COUNTERS_GRID}>
          {Array.from({ length: 6 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </ul>
      </div>
    )
  }

  if (query.error) {
    const message = query.error instanceof ApiError ? query.error.message : 'Could not load dashboard.'
    return <p className="text-sm text-destructive">{message}</p>
  }

  const counts = query.data.counts
  // Un conteo enlaza a su pantalla solo si el rol puede abrirla.
  return (
    <ul className={COUNTERS_GRID} aria-label="Right now">
      <StatTile label="Orders" value={String(counts.orders)} icon={Package} to={canOrders ? '/admin/orders' : undefined} />
      <StatTile
        label="Active quotes"
        value={String(counts.activeQuotes)}
        icon={FileText}
        to={canQuotes ? '/admin/quotes?status=ACTIVE' : undefined}
      />
      <StatTile
        label="Building quotes"
        value={String(counts.buildingQuotes)}
        icon={FilePen}
        to={canQuotes ? '/admin/quotes?status=BUILDING' : undefined}
      />
      <StatTile
        label="Active carts"
        value={String(counts.activeCarts)}
        icon={ShoppingCart}
        to={canCarts ? '/admin/carts?status=ACTIVE' : undefined}
      />
      <StatTile
        label="Abandoned carts"
        value={String(counts.abandonedCarts)}
        icon={Archive}
        to={canCarts ? '/admin/carts?status=ABANDONED' : undefined}
      />
      <StatTile
        label="Sales today"
        value={formatMoney(counts.salesToday)}
        icon={DollarSign}
        to={canOrders ? '/admin/orders?date=today' : undefined}
      />
    </ul>
  )
}
