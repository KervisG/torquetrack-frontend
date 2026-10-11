import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { StepIndicator, StepNav, StepPanel, useFormSteps } from '@/components/form-steps'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/money'
import { adminQuoteSchema, type AdminQuoteValues } from '@/lib/validators/admin-quote'

import { decodeQuoteVin } from '../api'
import { QuoteCatalogPicker } from './quote-catalog-picker'
import { QuoteTaxControls, type SavedQuoteTax } from './quote-tax-controls'
import { EDITABLE_QUOTE_STATUSES } from '../types'

type QuoteFormProps = {
  defaultValues: AdminQuoteValues
  submitting: boolean
  error: unknown
  onSubmit: (values: AdminQuoteValues) => void
  canSearchCatalog?: boolean
  // Identifican al cliente de la cotización: el impuesto se estima con su
  // exención, nunca con la del empleado en sesión.
  quoteId?: string
  customerId?: string
  // Con `tax_exemptions.review` el editor ofrece el override manual; sin él
  // el impuesto es de solo lectura (lo calcula el backend al guardar).
  canOverrideTax?: boolean
  savedTax?: SavedQuoteTax
  // Una cotización que ya existe se puede guardar desde cualquier paso.
  editing?: boolean
  // El modal suma "Cancel" a la barra de pasos y avisa si hay cambios.
  onCancel?: () => void
  onDirtyChange?: (dirty: boolean) => void
}

const emptyLine = {
  title: '',
  partNumber: '',
  quantity: 1,
  unitPrice: 0,
  coreCharge: 0,
}

// Cada paso valida solo sus campos antes de dejar avanzar. "Review" no tiene:
// muestra lo cargado y guarda.
const STEPS: Array<{ id: string; label: string; fields: FieldPath<AdminQuoteValues>[] }> = [
  { id: 'customer', label: 'Customer', fields: ['customer'] },
  { id: 'vehicle', label: 'Vehicle', fields: ['vehicle'] },
  { id: 'items', label: 'Items', fields: ['items'] },
  {
    id: 'shipping',
    label: 'Shipping & tax',
    fields: ['shippingAddress', 'shipping', 'tax', 'taxOverride', 'status', 'memo'],
  },
  { id: 'review', label: 'Review', fields: [] },
]

function joined(parts: Array<string | undefined>, separator = ' '): string {
  return parts.map((part) => (part ?? '').trim()).filter(Boolean).join(separator)
}

// Presentacional: no muestra totales. El backend los recalcula al guardar y
// el detalle muestra los que devolvió; un subtotal armado acá sería decorativo.
export function QuoteForm({
  defaultValues,
  submitting,
  error,
  onSubmit,
  canSearchCatalog = false,
  quoteId,
  customerId,
  canOverrideTax = false,
  savedTax,
  editing = false,
  onCancel,
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
  const values = useWatch({ control: form.control })
  const vehicle = values.vehicle
  const [vinError, setVinError] = useState<unknown>(null)
  const [vinPending, setVinPending] = useState(false)
  const errors = form.formState.errors
  const steps = useFormSteps(STEPS, { free: editing })
  const statuses: string[] = [...EDITABLE_QUOTE_STATUSES]
  // Un estado fijado por una acción (EXPIRED, CONVERTED) se conserva tal cual.
  if (!statuses.includes(defaultValues.status)) statuses.unshift(defaultValues.status)

  // Guarda desde cualquier paso; si la validación falla, va al primer paso
  // que tiene un error para que se vea.
  const save = form.handleSubmit(onSubmit, (invalid) => {
    const failed = STEPS.findIndex((step) =>
      step.fields.some((field) => field.split('.')[0] in invalid),
    )
    if (failed >= 0) steps.goTo(failed)
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (steps.isLast) {
      await save()
      return
    }
    if (await form.trigger(STEPS[steps.current].fields)) steps.next()
  }

  const at = (id: string) => STEPS[steps.current].id === id

  return (
    <form aria-label="Quote" className="space-y-6" noValidate onSubmit={handleSubmit}>
      <StepIndicator
        steps={STEPS}
        current={steps.current}
        reachable={steps.reachable}
        onSelect={steps.goTo}
      />

      <StepPanel active={at('customer')}>
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
      </StepPanel>

      <StepPanel active={at('vehicle')}>
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
      </StepPanel>

      <StepPanel active={at('items')}>
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Catalog</legend>
          <QuoteCatalogPicker
            vehicle={{
              year: vehicle?.year ?? '',
              make: vehicle?.make ?? '',
              model: vehicle?.model ?? '',
              engine: vehicle?.engine ?? '',
              vin: vehicle?.vin ?? '',
            }}
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
      </StepPanel>

      <StepPanel active={at('shipping')}>
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Ship to</legend>
          <div className="grid gap-4 sm:grid-cols-4">
            <FormField
              id="quote-ship-address1"
              label="Ship-to address"
              {...form.register('shippingAddress.address1')}
            />
            <FormField id="quote-ship-city" label="Ship-to city" {...form.register('shippingAddress.city')} />
            <FormField
              id="quote-ship-state"
              label="Ship-to state"
              maxLength={2}
              {...form.register('shippingAddress.state')}
            />
            <FormField id="quote-ship-zip" label="Ship-to ZIP" {...form.register('shippingAddress.zip')} />
          </div>
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
              form={form}
              canOverride={canOverrideTax}
              quoteId={quoteId}
              customerId={customerId}
              savedTax={savedTax}
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
      </StepPanel>

      <StepPanel active={at('review')}>
        <section aria-label="Review" className="space-y-4">
          <h3 className="text-lg font-semibold">Review</h3>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <ReviewItem label="Customer">
              {joined([values.customer?.name, values.customer?.company], ' · ') || '—'}
              <br />
              {joined([values.customer?.email, values.customer?.phone], ' · ')}
            </ReviewItem>
            <ReviewItem label="Vehicle">
              {joined([vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.engine]) || '—'}
              {vehicle?.vin ? (
                <>
                  <br />
                  VIN {vehicle.vin}
                </>
              ) : null}
            </ReviewItem>
            <ReviewItem label="Ship to">
              {joined(
                [
                  values.shippingAddress?.address1,
                  values.shippingAddress?.city,
                  joined([values.shippingAddress?.state, values.shippingAddress?.zip]),
                ],
                ', ',
              ) || '—'}
            </ReviewItem>
            <ReviewItem label="Status">{values.status}</ReviewItem>
          </dl>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Items</p>
            {values.items?.length ? (
              <ul className="mt-1 divide-y rounded-md border text-sm">
                {values.items.map((item, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                    <span>
                      {item.quantity} × {item.title || '—'}
                      {item.partNumber ? ` (${item.partNumber})` : ''}
                    </span>
                    <span>
                      {formatMoney(Number(item.unitPrice) || 0)} each
                      {Number(item.coreCharge) > 0
                        ? ` + ${formatMoney(Number(item.coreCharge))} core`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm">No items yet.</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Shipping {formatMoney(Number(values.shipping) || 0)}. Tax and totals are calculated
            when you save.
          </p>
          {values.memo ? <p className="text-sm">Memo: {values.memo}</p> : null}
        </section>
      </StepPanel>

      <FormError error={error} />
      <StepNav
        isFirst={steps.isFirst}
        isLast={steps.isLast}
        submitting={submitting}
        saveLabel="Save quote"
        saveAnytime={editing}
        onBack={steps.back}
        onSave={() => void save()}
        onCancel={onCancel}
      />
    </form>
  )
}

function ReviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
