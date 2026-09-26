import { useState, type ReactNode } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import type { QuoteLineValues } from '@/lib/validators/admin-quote'

import { estimateQuoteTax } from '../api'

type QuoteTaxControlsProps = {
  items: QuoteLineValues[]
  shipping: number
  taxError?: string
  onTax: (tax: number) => void
  taxInput: ReactNode
}

// La suma solo arma el pedido al servicio de impuesto. El total de la
// cotización lo recalcula el backend al guardar.
function requestAmounts(items: QuoteLineValues[]) {
  return items.reduce(
    (totals, item) => ({
      subtotal: totals.subtotal + (Number.isFinite(item.quantity) ? item.quantity : 0) * (Number.isFinite(item.unitPrice) ? item.unitPrice : 0),
      coreCharge: totals.coreCharge + (Number.isFinite(item.quantity) ? item.quantity : 0) * (Number.isFinite(item.coreCharge) ? item.coreCharge : 0),
    }),
    { subtotal: 0, coreCharge: 0 },
  )
}

export function QuoteTaxControls({ items, shipping, taxError, onTax, taxInput }: QuoteTaxControlsProps) {
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [manual, setManual] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [source, setSource] = useState('')

  async function calculate() {
    setPending(true)
    setError(null)
    try {
      const amounts = requestAmounts(items)
      const result = await estimateQuoteTax({
        subtotal: amounts.subtotal,
        coreCharge: amounts.coreCharge,
        shipping: Number.isFinite(shipping) ? shipping : 0,
        state,
        zip,
      })
      onTax(result.tax)
      setSource(result.source)
      setManual(false)
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4 sm:col-span-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="quote-tax-state" label="Ship-to state" value={state} onChange={(event) => setState(event.target.value)} />
        <FormField id="quote-tax-zip" label="Ship-to ZIP" value={zip} onChange={(event) => setZip(event.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => void calculate()}>
          {pending ? 'Calculating…' : 'Auto tax'}
        </Button>
        <Button type="button" variant="outline" disabled={pending || manual} onClick={() => void calculate()}>
          Recalculate
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={manual}
            onChange={(event) => setManual(event.target.checked)}
          />
          Manual override
        </label>
      </div>
      {source && !manual ? <p className="text-sm text-muted-foreground">{source}</p> : null}
      <div className={manual ? undefined : 'pointer-events-none opacity-70'}>{taxInput}</div>
      {taxError ? <p className="text-sm text-destructive">{taxError}</p> : null}
      {error ? <FormError error={error} /> : null}
    </div>
  )
}
