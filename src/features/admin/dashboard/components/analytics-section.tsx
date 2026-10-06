import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { lazy, Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { getDashboardAnalytics } from '../api'
import { formatLongDate, RANGE_LABELS, statusLabel } from '../format'
import { dashboardKeys } from '../query-keys'
import { ANALYTICS_RANGES, type AnalyticsRange, type DashboardAnalytics, type RevenuePoint } from '../types'
import { FunnelCard } from './funnel-card'
import { KpiTile, KpiTileSkeleton } from './kpi-tile'
import { RangeSelector } from './range-selector'
import { TopProductsTable } from './top-products-table'

// Recharts pesa: se pide recién cuando hay datos que graficar y nunca entra
// en el bundle del storefront.
const RevenueChart = lazy(async () => ({ default: (await import('./analytics-charts')).RevenueChart }))
const StatusChart = lazy(async () => ({ default: (await import('./analytics-charts')).StatusChart }))

const DEFAULT_RANGE: AnalyticsRange = '30d'

function parseRange(value: string | null): AnalyticsRange {
  return ANALYTICS_RANGES.find((range) => range === value) ?? DEFAULT_RANGE
}

function formatCount(value: number): string {
  return String(Math.round(value))
}

function isEmpty(data: DashboardAnalytics): boolean {
  return (
    data.kpis.revenue.value === 0 &&
    data.kpis.orders.value === 0 &&
    data.kpis.refunds.value === 0 &&
    data.topProducts.length === 0 &&
    data.ordersByStatus.every((row) => row.count === 0) &&
    data.quoteFunnel.created === 0 &&
    data.cartFunnel.created === 0
  )
}

export function AnalyticsSection() {
  // El rango vive en la URL: recargar o compartir el enlace conserva la vista.
  // El valor por defecto no se escribe.
  const [params, setParams] = useSearchParams()
  const range = parseRange(params.get('range'))
  const analytics = useQuery({
    queryKey: dashboardKeys.analytics(range),
    queryFn: () => getDashboardAnalytics(range),
    // Al cambiar de rango se mantiene el anterior a la vista, atenuado, en
    // lugar de volver a los esqueletos.
    placeholderData: keepPreviousData,
  })

  function changeRange(next: AnalyticsRange) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next === DEFAULT_RANGE) updated.delete('range')
        else updated.set('range', next)
        return updated
      },
      { replace: true },
    )
  }

  const period =
    analytics.data && !analytics.isPlaceholderData
      ? `${formatLongDate(analytics.data.start, 'day')} – ${formatLongDate(analytics.data.end, 'day')} (${analytics.data.timeZone})`
      : RANGE_LABELS[range].long

  return (
    <section aria-labelledby="dashboard-analytics-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="dashboard-analytics-heading" className="text-lg font-semibold tracking-tight">
            Performance
          </h2>
          <p className="text-sm text-muted-foreground">{period}</p>
        </div>
        <RangeSelector value={range} onChange={changeRange} />
      </div>
      <AnalyticsBody query={analytics} onRetry={() => void analytics.refetch()} />
    </section>
  )
}

function AnalyticsBody({
  query,
  onRetry,
}: {
  query: UseQueryResult<DashboardAnalytics>
  onRetry: () => void
}) {
  if (query.isPending) return <AnalyticsSkeleton />

  if (query.error && !query.data) {
    // Mismo criterio que `PermissionNotice`: se explica el motivo en vez de
    // mostrar el error crudo.
    if (query.error instanceof ApiError && query.error.status === 403) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You do not have permission to view analytics.</p>
          </CardContent>
        </Card>
      )
    }
    const message = query.error instanceof ApiError ? query.error.message : 'Could not load analytics.'
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={query.isFetching}>
            {query.isFetching ? 'Retrying…' : 'Try again'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const data = query.data
  if (!data) return null

  return (
    <div
      className={cn('space-y-4 transition-opacity', query.isPlaceholderData && 'opacity-60')}
      aria-busy={query.isFetching}
    >
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key metrics">
        <KpiTile label="Revenue" kpi={data.kpis.revenue} format={formatMoney} />
        <KpiTile label="Orders" kpi={data.kpis.orders} format={formatCount} />
        <KpiTile label="Average order value" kpi={data.kpis.averageOrderValue} format={formatMoney} />
        <KpiTile label="Refunds" kpi={data.kpis.refunds} format={formatMoney} increaseIsBad />
      </ul>
      {isEmpty(data) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">No sales in this period yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Orders, quotes and carts will show up here as soon as they come in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnalyticsCharts data={data} />
      )}
    </div>
  )
}

function AnalyticsCharts({ data }: { data: DashboardAnalytics }) {
  const statuses = data.ordersByStatus.filter((row) => row.count > 0)
  const peak = data.revenueSeries.reduce<RevenuePoint | null>(
    (best, point) => (best === null || point.revenue > best.revenue ? point : best),
    null,
  )
  const unit = data.granularity === 'month' ? 'month' : 'day'
  const revenueSummary =
    peak && peak.revenue > 0
      ? `Revenue of ${formatMoney(data.kpis.revenue.value)} from ${data.kpis.orders.value} orders. Best ${unit}: ${formatLongDate(peak.date, data.granularity)} with ${formatMoney(peak.revenue)}.`
      : 'No revenue in this period.'
  // Proporción para mostrar, no un monto: no contradice la regla de no recalcular dinero.
  const cartConversion = data.cartFunnel.created
    ? (data.cartFunnel.converted / data.cartFunnel.created) * 100
    : 0

  return (
    <>
      <ChartCard title="Revenue over time" description={`Revenue and orders per ${unit}`}>
        <figure className="m-0">
          <figcaption className="sr-only">{revenueSummary}</figcaption>
          <Suspense fallback={<ChartSkeleton className="h-80 sm:h-96" />}>
            <RevenueChart data={data.revenueSeries} granularity={data.granularity} />
          </Suspense>
          <RevenueTable data={data} />
        </figure>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Orders by status" description="Orders placed in this period">
          {statuses.length ? (
            <figure className="m-0">
              <figcaption className="sr-only">
                {statuses.map((row) => `${statusLabel(row.status)}: ${row.count}`).join(', ')}
              </figcaption>
              <Suspense fallback={<ChartSkeleton className="h-40" />}>
                <StatusChart data={statuses} />
              </Suspense>
            </figure>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders in this period.</p>
          )}
        </ChartCard>
        <ChartCard title="Top products" description="Best sellers by revenue">
          <TopProductsTable rows={data.topProducts} periodRevenue={data.kpis.revenue.value} />
        </ChartCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FunnelCard
          title="Quote funnel"
          conversionRate={data.quoteFunnel.conversionRate}
          steps={[
            { label: 'Created', count: data.quoteFunnel.created },
            { label: 'Sent', count: data.quoteFunnel.sent },
            { label: 'Converted', count: data.quoteFunnel.converted },
          ]}
        />
        <FunnelCard
          title="Cart funnel"
          conversionRate={cartConversion}
          steps={[
            { label: 'Carts created', count: data.cartFunnel.created },
            { label: 'Checkout started', count: data.cartFunnel.checkoutStarted },
            { label: 'Converted', count: data.cartFunnel.converted },
          ]}
          footnote={`${data.cartFunnel.abandoned} abandoned ${data.cartFunnel.abandoned === 1 ? 'cart' : 'carts'}`}
        />
      </div>
    </>
  )
}

// Vista de tabla del gráfico: quien no puede ver el gráfico (o prefiere los
// números) tiene los mismos datos.
function RevenueTable({ data }: { data: DashboardAnalytics }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
        View as table
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr className="text-left">
              <th scope="col" className="px-3 py-2 font-medium">Date</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Revenue</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueSeries.map((point) => (
              <tr key={point.date} className="border-t">
                <td className="px-3 py-1.5">{formatLongDate(point.date, data.granularity)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(point.revenue)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{point.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  )
}

function ChartSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="sr-only">Loading analytics…</p>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTileSkeleton />
        <KpiTileSkeleton />
        <KpiTileSkeleton />
        <KpiTileSkeleton />
      </ul>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <ChartSkeleton className="h-4 w-40" />
          <ChartSkeleton className="h-72" />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton className="h-56" />
        <ChartSkeleton className="h-56" />
      </div>
    </div>
  )
}
