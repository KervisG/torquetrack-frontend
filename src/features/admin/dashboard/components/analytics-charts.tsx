import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMoney } from '@/lib/money'

import { formatAxisDate, formatCompactMoney, formatLongDate, statusLabel } from '../format'
import type { AnalyticsGranularity, RevenuePoint, StatusCount } from '../types'

// Este módulo es el único que importa Recharts y se carga con `React.lazy`:
// la librería queda en un chunk propio que solo pide el panel.

// Los colores salen de los tokens de `index.css`; así el gráfico sigue al
// tema si cambia la paleta.
const AXIS_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
const GRID_STROKE = 'hsl(var(--border))'
const REVENUE_COLOR = 'hsl(var(--chart-1))'
const ORDERS_COLOR = 'hsl(var(--chart-2))'
// Ingresos y pedidos comparten eje X y cursor, pero cada uno tiene su propia
// escala: dos gráficos alineados en vez de un doble eje Y difícil de leer.
const SYNC_ID = 'dashboard-revenue'

type SeriesProps = { data: RevenuePoint[]; granularity: AnalyticsGranularity }

export function RevenueChart({ data, granularity }: SeriesProps) {
  return (
    <div className="space-y-2">
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId={SYNC_ID} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="dashboard-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={REVENUE_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={REVENUE_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompactMoney(value)}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
              content={(props) => (
                <SeriesTooltip
                  active={props.active}
                  label={props.label}
                  data={data}
                  granularity={granularity}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={REVENUE_COLOR}
              strokeWidth={2}
              fill="url(#dashboard-revenue-fill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs font-medium text-muted-foreground">Orders</p>
      <div className="h-24 sm:h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} syncId={SYNC_ID} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
              minTickGap={24}
              tickFormatter={(value: string) => formatAxisDate(value, granularity)}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={56}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={(props) => (
                <SeriesTooltip
                  active={props.active}
                  label={props.label}
                  data={data}
                  granularity={granularity}
                />
              )}
            />
            <Bar dataKey="orders" name="Orders" fill={ORDERS_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SeriesTooltip({
  active,
  label,
  data,
  granularity,
}: {
  active?: boolean
  label?: string | number
  data: RevenuePoint[]
  granularity: AnalyticsGranularity
}) {
  const point = active ? data.find((row) => row.date === label) : undefined
  if (!point) return null
  return (
    <div className="min-w-40 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-medium">{formatLongDate(point.date, granularity)}</p>
      <TooltipRow color={REVENUE_COLOR} label="Revenue" value={formatMoney(point.revenue)} />
      <TooltipRow
        color={ORDERS_COLOR}
        label="Orders"
        value={String(point.orders)}
      />
    </div>
  )
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-sm" style={{ background: color }} aria-hidden="true" />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </p>
  )
}

export function StatusChart({ data }: { data: StatusCount[] }) {
  const rows = data.map((row) => ({ ...row, label: statusLabel(row.status) }))
  return (
    // La altura crece con la cantidad de estados para que ninguna barra quede apretada.
    <div style={{ height: rows.length * 40 + 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={128}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={(props) => {
              const row = props.active ? rows.find((item) => item.label === props.label) : undefined
              if (!row) return null
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                  <span className="font-medium">{row.label}</span>: {row.count}{' '}
                  {row.count === 1 ? 'order' : 'orders'}
                </div>
              )
            }}
          />
          <Bar dataKey="count" name="Orders" fill={REVENUE_COLOR} radius={[0, 4, 4, 0]} barSize={20}>
            <LabelList
              dataKey="count"
              position="right"
              className="tabular-nums"
              style={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
