import { useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { estimateQuoteTax } from '../api'
import type { QuoteTaxSource } from '../types'

export type SavedQuoteTax = {
  amount: number
  source: QuoteTaxSource
  description: string
}

type QuoteTaxControlsProps = {
  form: UseFormReturn<AdminQuoteValues>
  // Solo con `tax_exemptions.review`: el backend rechaza el override sin él.
  canOverride: boolean
  quoteId?: string
  customerId?: string
  savedTax?: SavedQuoteTax
}

const SOURCE_LABELS: Record<Exclude<QuoteTaxSource, ''>, string> = {
  calculated: 'Calculated',
  exempt: 'Tax exempt',
  manual: 'Manual override',
}

// La suma solo arma el pedido de estimación. El impuesto que vale es el que
// recalcula el backend al guardar.
function requestAmounts(items: AdminQuoteValues['items']) {
  const finite = (value: number) => (Number.isFinite(value) ? value : 0)
  return items.reduce(
    (totals, item) => ({
      subtotal: totals.subtotal + finite(item.quantity) * finite(item.unitPrice),
      coreCharge: totals.coreCharge + finite(item.quantity) * finite(item.coreCharge),
    }),
    { subtotal: 0, coreCharge: 0 },
  )
}

export function QuoteTaxControls({
  form,
  canOverride,
  quoteId,
  customerId,
  savedTax,
}: QuoteTaxControlsProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [estimate, setEstimate] = useState<{ tax: number; source: string } | null>(null)
  const items = useWatch({ control: form.control, name: 'items' })
  const shipping = useWatch({ control: form.control, name: 'shipping' })
  const address = useWatch({ control: form.control, name: 'shippingAddress' })
  const customerEmail = useWatch({ control: form.control, name: 'customer.email' })
  const overriding = useWatch({ control: form.control, name: 'taxOverride.enabled' })
  const errors = form.formState.errors
  const manual = canOverride && overriding

  async function calculate() {
    setPending(true)
    setError(null)
    try {
      const amounts = requestAmounts(items ?? [])
      const result = await estimateQuoteTax({
        subtotal: amounts.subtotal,
        coreCharge: amounts.coreCharge,
        shipping: Number.isFinite(shipping) ? shipping : 0,
        address: address ?? { address1: '', city: '', state: '', zip: '' },
        quoteId,
        customerId,
        email: customerEmail ?? '',
      })
      form.setValue('tax', result.tax, { shouldDirty: true, shouldValidate: true })
      form.setValue('taxOverride.enabled', false, { shouldDirty: true })
      setEstimate({ tax: result.tax, source: result.source })
    } catch (caught) {
      setError(caught)
    } finally {
      setPending(false)
    }
  }

  let shown: { amount: string; source: string }
  if (estimate) {
    shown = { amount: formatMoney(estimate.tax), source: `Estimate: ${estimate.source}` }
  } else if (savedTax?.source) {
    const label = SOURCE_LABELS[savedTax.source]
    shown = {
      amount: formatMoney(savedTax.amount),
      source: savedTax.description ? `${label} (${savedTax.description})` : label,
    }
  } else {
    shown = { amount: '—', source: 'Calculated when you save' }
  }

  return (
    <div className="space-y-4 sm:col-span-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => void calculate()}>
          {pending ? 'Calculating…' : 'Estimate tax'}
        </Button>
        {canOverride ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('taxOverride.enabled')} />
            Manual override
          </label>
        ) : null}
      </div>
      {manual ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="quote-tax"
            label="Tax"
            type="number"
            min={0}
            step="0.01"
            error={errors.tax?.message}
            {...form.register('tax', { valueAsNumber: true })}
          />
          <FormField
            id="quote-tax-override-reason"
            label="Override reason"
            error={errors.taxOverride?.reason?.message}
            {...form.register('taxOverride.reason')}
          />
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <dl aria-label="Tax" className="space-y-1">
            <div className="flex gap-2">
              <dt className="font-medium">Tax</dt>
              <dd>{shown.amount}</dd>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <dt>Source</dt>
              <dd>{shown.source}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground">
            Tax is recalculated from the ship-to address when you save.
          </p>
        </div>
      )}
      {error ? <FormError error={error} /> : null}
    </div>
  )
}
