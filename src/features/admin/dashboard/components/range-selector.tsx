import { cn } from '@/lib/utils'

import { RANGE_LABELS } from '../format'
import { ANALYTICS_RANGES, type AnalyticsRange } from '../types'

export function RangeSelector({
  value,
  onChange,
}: {
  value: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-md border bg-muted/50 p-0.5">
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          aria-pressed={value === range}
          aria-label={RANGE_LABELS[range].long}
          title={RANGE_LABELS[range].long}
          className={cn(
            'h-8 min-w-11 rounded px-3 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === range
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onChange(range)}
        >
          {RANGE_LABELS[range].short}
        </button>
      ))}
    </div>
  )
}
