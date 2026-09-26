import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { adminQuoteSchema, type AdminQuoteValues } from '@/lib/validators/admin-quote'

import { decodeQuoteVin } from '../api'
import { QuoteCatalogPicker } from './quote-catalog-picker'
import { QuoteTaxControls } from './quote-tax-controls'
import { EDITABLE_QUOTE_STATUSES } from '../types'

type QuoteFormProps = {
  defaultValues: AdminQuoteValues
  submitting: boolean
  error: unknown
  onSubmit: (values: AdminQuoteValues) => void
  canSearchCatalog?: boolean
  // El modal manda el submit desde su barra fija y avisa si hay cambios.
  formId?: string
  hideSubmit?: boolean
  onDirtyChange?: (dirty: boolean) => void
}

const emptyLine = {
  title: '',
  partNumber: '',
  quantity: 1,
  unitPrice: 0,
  coreCharge: 0,
}

// Presentacional: no muestra totales. El backend los recalcula al guardar y
// el detalle muestra los que devolvió; un subtotal armado acá sería decorativo.
export function QuoteForm({
  defaultValues,
  submitting,
  error,
  onSubmit,
  canSearchCatalog = false,
  formId,
  hideSubmit = false,
  onDirtyChange,
}: QuoteFormProps) {
  const form = useForm<AdminQuoteValues>({
    resolver: zodResolver(adminQuoteSchema),
    defaultValues,
  })
  const isDirty = form.formState.isDirty
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])
  const items = useFieldArray({ control: form.control, name: 'items' })
  const vehicle = useWatch({ control: form.control, name: 'vehicle' })
  const lineItems = useWatch({ control: form.control, name: 'items' })
  const shipping = useWatch({ control: form.control, name: 'shipping' })
  const [vinError, setVinError] = useState<unknown>(null)
  const [vinPending, setVinPending] = useState(false)
  const errors = form.formState.errors
  const statuses: string[] = [...EDITABLE_QUOTE_STATUSES]
  // Un estado fijado por una acción (EXPIRED, CONVERTED) se conserva tal cual.
  if (!statuses.includes(defaultValues.status)) statuses.unshift(defaultValues.status)

  return (
    <form
      id={formId}
      aria-label="Quote"
      className="space-y-8"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Customer</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="quote-customer-name"
            label="Customer name"
            error={errors.customer?.name?.message}
            {...form.register('customer.name')}
          />
          <FormField id="quote-customer-company" label="Company" {...form.register('customer.company')} />
          <FormField
            id="quote-customer-email"
            label="Customer email"
            type="email"
            error={errors.customer?.email?.message}
            {...form.register('customer.email')}
          />
          <FormField id="quote-customer-phone" label="Phone" {...form.register('customer.phone')} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Vehicle</legend>
        <div className="grid gap-4 sm:grid-cols-5">
          <FormField id="quote-vehicle-year" label="Year" {...form.register('vehicle.year')} />
          <FormField id="quote-vehicle-make" label="Make" {...form.register('vehicle.make')} />
          <FormField id="quote-vehicle-model" label="Model" {...form.register('vehicle.model')} />
          <FormField id="quote-vehicle-engine" label="Engine" {...form.register('vehicle.engine')} />
          <FormField
            id="quote-vehicle-vin"
            label="VIN"
            maxLength={17}
            action={
              <Button
                type="button"
                variant="outline"
                disabled={vinPending}
                onClick={() => {
                  const vin = form.getValues('vehicle.vin').trim()
                  setVinPending(true)
                  setVinError(null)
                  void decodeQuoteVin(vin)
                    .then((result) => {
                      form.setValue('vehicle.year', result.vehicle.year, { shouldDirty: true })
                      form.setValue('vehicle.make', result.vehicle.make, { shouldDirty: true })
                      form.setValue('vehicle.model', result.vehicle.model, { shouldDirty: true })
                      form.setValue('vehicle.engine', result.vehicle.engine, { shouldDirty: true })
                      form.setValue('vehicle.vin', result.vehicle.vin, { shouldDirty: true })
                    })
                    .catch((caught: unknown) => setVinError(caught))
                    .finally(() => setVinPending(false))
                }}
              >
                {vinPending ? 'Searching…' : 'Search VIN'}
              </Button>
            }
            {...form.register('vehicle.vin')}
          />
        </div>
        {vinError ? <FormError error={vinError} /> : null}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Catalog</legend>
        <QuoteCatalogPicker
          vehicle={vehicle ?? { year: '', make: '', model: '', engine: '', vin: '' }}
          canSearch={canSearchCatalog}
          onAdd={(line) => items.append(line)}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Items</legend>
        {items.fields.map((field, index) => {
          const lineErrors = errors.items?.[index]
          return (
            <fieldset
              key={field.id}
              aria-label={`Item ${index + 1}`}
              className="grid gap-3 rounded-md border p-3 sm:grid-cols-[2fr_1fr_5rem_7rem_7rem_auto] sm:items-end"
            >
              <FormField
                id={`quote-item-${index}-title`}
                label="Description"
                error={lineErrors?.title?.message}
                {...form.register(`items.${index}.title`)}
              />
              <FormField
                id={`quote-item-${index}-part`}
                label="Part #"
                {...form.register(`items.${index}.partNumber`)}
              />
              <FormField
                id={`quote-item-${index}-qty`}
                label="Qty"
                type="number"
                min={1}
                step={1}
                error={lineErrors?.quantity?.message}
                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
              />
              <FormField
                id={`quote-item-${index}-price`}
                label="Unit price"
                type="number"
                min={0}
                step="0.01"
                error={lineErrors?.unitPrice?.message}
                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
              />
              <FormField
                id={`quote-item-${index}-core`}
                label="Core charge"
                type="number"
                min={0}
                step="0.01"
                error={lineErrors?.coreCharge?.message}
                {...form.register(`items.${index}.coreCharge`, { valueAsNumber: true })}
              />
              <Button type="button" variant="outline" onClick={() => items.remove(index)}>
                Remove
              </Button>
            </fieldset>
          )
        })}
        {errors.items?.message || errors.items?.root?.message ? (
          <p className="text-sm text-destructive">
            {errors.items?.message ?? errors.items?.root?.message}
          </p>
        ) : null}
        <Button type="button" variant="outline" onClick={() => items.append({ ...emptyLine })}>
          Add item
        </Button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Pricing & status</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="quote-shipping"
            label="Shipping"
            type="number"
            min={0}
            step="0.01"
            error={errors.shipping?.message}
            {...form.register('shipping', { valueAsNumber: true })}
          />
          <QuoteTaxControls
            items={lineItems ?? []}
            shipping={shipping ?? 0}
            taxError={errors.tax?.message}
            onTax={(tax) => form.setValue('tax', tax, { shouldDirty: true, shouldValidate: true })}
            taxInput={
              <FormField
                id="quote-tax"
                label="Tax"
                type="number"
                min={0}
                step="0.01"
                error={errors.tax?.message}
                {...form.register('tax', { valueAsNumber: true })}
              />
            }
          />
          <SelectField
            id="quote-status"
            label="Status"
            options={statuses.map((status) => ({ value: status, label: status }))}
            {...form.register('status')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-memo">Memo</Label>
          <textarea
            id="quote-memo"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('memo')}
          />
        </div>
      </fieldset>

      <FormError error={error} />
      {hideSubmit ? null : (
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save quote'}
        </Button>
      )}
    </form>
  )
}
