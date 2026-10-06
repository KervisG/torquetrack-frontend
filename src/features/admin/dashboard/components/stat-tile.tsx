import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

type StatTileProps = {
  label: string
  value: string
  icon: LucideIcon
  to?: string
}

// El nombre accesible del enlace queda en "<label> <valor>": el ícono y la
// flecha son decorativos.
export function StatTile({ label, value, icon: Icon, to }: StatTileProps) {
  const body = (
    <div
      className={cn(
        'flex h-full items-center gap-3 rounded-lg border bg-card p-3 shadow-sm sm:p-4',
        to && 'transition-colors group-hover:border-foreground/30 group-hover:bg-muted/40',
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="block text-xl font-semibold tabular-nums tracking-tight">{value}</span>
      </span>
      {to ? (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 max-sm:hidden"
          aria-hidden="true"
        />
      ) : null}
    </div>
  )

  return (
    <li>
      {to ? (
        <Link
          to={to}
          className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

export function StatTileSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
      <span className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
      <span className="flex-1 space-y-2">
        <span className="block h-3 w-20 animate-pulse rounded bg-muted" />
        <span className="block h-5 w-12 animate-pulse rounded bg-muted" />
      </span>
    </li>
  )
}
