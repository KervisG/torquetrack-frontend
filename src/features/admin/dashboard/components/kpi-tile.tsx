import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

import { formatPercent } from '../format'
import type { KpiValue } from '../types'

type KpiTileProps = {
  label: string
  kpi: KpiValue
  format: (value: number) => string
  // En reembolsos subir es malo: invierte el tono, no la flecha.
  increaseIsBad?: boolean
}

export function KpiTile({ label, kpi, format, increaseIsBad = false }: KpiTileProps) {
  return (
    <li className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
        {format(kpi.value)}
      </p>
      <Change kpi={kpi} format={format} increaseIsBad={increaseIsBad} />
    </li>
  )
}

function Change({
  kpi,
  format,
  increaseIsBad,
}: {
  kpi: KpiValue
  format: (value: number) => string
  increaseIsBad: boolean
}) {
  // Sin período anterior no hay porcentaje que mostrar.
  if (kpi.changePercent === null) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true">—</span>
        No prior data
      </p>
    )
  }

  const change = kpi.changePercent
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const good = direction === 'flat' ? null : (direction === 'up') !== increaseIsBad
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const sign = change > 0 ? '+' : ''
  const words = direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums',
          good === null && 'bg-muted text-muted-foreground',
          good === true && 'bg-emerald-50 text-emerald-800',
          good === false && 'bg-red-50 text-red-800',
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="sr-only">{words} </span>
        {sign}
        {formatPercent(change)}
      </span>
      <span className="text-muted-foreground">vs {format(kpi.previous)} prior period</span>
    </p>
  )
}

export function KpiTileSkeleton() {
  return (
    <li className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
      <span className="block h-7 w-28 animate-pulse rounded bg-muted" />
      <span className="block h-3 w-32 animate-pulse rounded bg-muted" />
    </li>
  )
}
