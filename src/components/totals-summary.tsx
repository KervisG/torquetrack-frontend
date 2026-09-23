import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/money'

type Totals = {
  subtotal?: number
  core?: number
  shipping?: number
  tax?: number
  total?: number
}

// Muestra los totales tal como los devolvió la API. Nunca se suman en el
// cliente: el backend es el único que reprecia.
export function TotalsSummary({ totals }: { totals: Totals }) {
  return (
    <dl aria-label="Totals" className="space-y-2 text-sm">
      <Row label="Subtotal" value={totals.subtotal} />
      <Row label="Core charges" value={totals.core} />
      <Row label="Shipping" value={totals.shipping} />
      <Row label="Tax" value={totals.tax} />
      <Separator />
      <div className="flex justify-between text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  )
}

function Row({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatMoney(value)}</dd>
    </div>
  )
}
