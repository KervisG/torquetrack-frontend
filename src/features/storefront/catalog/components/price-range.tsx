import { Slider } from '@/components/ui/slider'
import { formatMoney } from '@/lib/money'

type PriceRangeProps = {
  ceiling: number
  value: [number, number] | null
  onChange: (next: [number, number]) => void
}

export function PriceRange({ ceiling, value, onChange }: PriceRangeProps) {
  const current = value ?? [0, ceiling]

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {formatMoney(current[0])} – {formatMoney(current[1])}
      </p>
      {/* Dos extremos: el tramo ámbar es el precio que queda seleccionado. */}
      <Slider
        aria-label="Price"
        min={0}
        max={Math.max(ceiling, 1)}
        step={1}
        disabled={ceiling <= 0}
        value={current}
        labels={['Minimum price', 'Maximum price']}
        onValueChange={(next) => onChange([next[0] ?? 0, next[1] ?? ceiling])}
      />
    </div>
  )
}
