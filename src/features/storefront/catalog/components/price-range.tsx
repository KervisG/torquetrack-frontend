import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { formatMoney } from '@/lib/money'

type PriceRangeProps = {
  // Tope del catálogo completo (no de la página visible). Cero = sin precios.
  ceiling: number
  min: string
  max: string
  onChange: (next: { min: string; max: string }) => void
}

// El precio se acota con dos campos libres; el slider es un atajo dentro del
// rango del catálogo. Sin acotar se lee "Any price", no un tope inventado.
export function PriceRange({ ceiling, min, max, onChange }: PriceRangeProps) {
  const minNumber = parseAmount(min)
  const maxNumber = parseAmount(max)
  const sliderValue: [number, number] = [
    clamp(minNumber ?? 0, 0, ceiling),
    clamp(maxNumber ?? ceiling, 0, ceiling),
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{summary(minNumber, maxNumber)}</p>
      <div className="flex items-center gap-2">
        <Input
          aria-label="Min price"
          inputMode="decimal"
          placeholder="Min"
          value={min}
          onChange={(event) => onChange({ min: event.target.value, max })}
        />
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          –
        </span>
        <Input
          aria-label="Max price"
          inputMode="decimal"
          placeholder="Max"
          value={max}
          onChange={(event) => onChange({ min, max: event.target.value })}
        />
      </div>
      {ceiling > 0 ? (
        <>
          {/* Dos extremos: el tramo ámbar es el precio que queda seleccionado. */}
          <Slider
            aria-label="Price"
            min={0}
            max={ceiling}
            step={1}
            value={sliderValue}
            labels={['Minimum price', 'Maximum price']}
            onValueChange={(next) => {
              const low = next[0] ?? 0
              const high = next[1] ?? ceiling
              // En los extremos el slider no acota: deja el campo vacío.
              onChange({
                min: low > 0 ? String(low) : '',
                max: high < ceiling ? String(high) : '',
              })
            }}
          />
          <p className="text-xs text-muted-foreground">Catalog prices up to {formatMoney(ceiling)}</p>
        </>
      ) : null}
    </div>
  )
}

function parseAmount(value: string): number | null {
  const trimmed = value.replace(/[$,\s]/g, '')
  if (!trimmed) return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) ? amount : null
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}

function summary(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Any price'
  if (max === null) return `${formatMoney(min ?? 0)} and up`
  if (min === null) return `Up to ${formatMoney(max)}`
  return `${formatMoney(min)} – ${formatMoney(max)}`
}
