import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { formatPercent } from '../format'

type FunnelStep = { label: string; count: number }

type FunnelCardProps = {
  title: string
  steps: FunnelStep[]
  conversionRate: number
  footnote?: ReactNode
}

// Cada barra se mide contra el primer paso, así el embudo se lee de arriba
// hacia abajo; el porcentaje acompaña al ancho para no depender del color.
export function FunnelCard({ title, steps, conversionRate, footnote }: FunnelCardProps) {
  const top = steps[0]?.count ?? 0

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{formatPercent(conversionRate)}</span>{' '}
          converted
        </p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3" aria-label={`${title} steps`}>
          {steps.map((step, index) => {
            const share = top > 0 ? (step.count / top) * 100 : 0
            return (
              <li key={step.label}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">
                    <span className="font-medium">{step.count}</span>
                    {index > 0 ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">({formatPercent(share)})</span>
                    ) : null}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${share}%`,
                      background: 'hsl(var(--chart-1))',
                      // Cada paso más claro que el anterior refuerza el orden del embudo.
                      opacity: 1 - index * 0.2,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
        {footnote ? <p className="mt-4 text-xs text-muted-foreground">{footnote}</p> : null}
      </CardContent>
    </Card>
  )
}
