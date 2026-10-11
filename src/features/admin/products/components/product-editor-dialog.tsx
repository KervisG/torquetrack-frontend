import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, type FormEvent } from 'react'
import { Controller, useForm, type FieldPath } from 'react-hook-form'

import { FormField } from '@/components/form-field'
import { StepIndicator, StepNav, StepPanel, useFormSteps } from '@/components/form-steps'
import { useApiFieldError } from '@/components/use-api-field-error'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { friendlyApiError } from '@/lib/api-errors'
import { buildAdminProductSchema, type AdminProductValues } from '@/lib/validators/admin-product'

import type { AdminProduct } from '../types'

import { CompatibleVehiclesField } from './compatible-vehicles-field'
import { ProductImagesField } from './product-images-field'

const emptyProduct: AdminProductValues = {
  title: '',
  partNumber: '',
  category: '',
  condition: '',
  make: '',
  model: '',
  yearFrom: '',
  yearTo: '',
  engine: '',
  price: '',
  coreCharge: 0,
  fitment: '',
  description: '',
  warranty: '',
  shippingWeight: 0,
  packageLength: 0,
  packageWidth: 0,
  packageHeight: 0,
  image: '',
  supplier: '',
  supplierPartNumber: '',
  purchaseCost: 0,
  supplierUrl: '',
  internalNotes: '',
  active: true,
  applicationIds: [],
}

function valuesFor(product: AdminProduct): AdminProductValues {
  return {
    ...emptyProduct,
    title: product.title ?? '',
    partNumber: product.partNumber ?? '',
    category: product.category ?? '',
    condition: product.condition ?? '',
    make: product.make ?? '',
    model: product.model ?? '',
    yearFrom: product.yearFrom ? String(product.yearFrom) : '',
    yearTo: product.yearTo ? String(product.yearTo) : '',
    engine: product.engine ?? '',
    price: product.price ? String(product.price) : '',
    coreCharge: product.coreCharge ?? 0,
    fitment: product.fitment ?? '',
    description: product.description ?? '',
    warranty: product.warranty ?? '',
    shippingWeight: product.shippingWeight ?? 0,
    packageLength: product.packageLength ?? 0,
    packageWidth: product.packageWidth ?? 0,
    packageHeight: product.packageHeight ?? 0,
    image: product.image ?? '',
    supplier: product.supplier ?? '',
    supplierPartNumber: product.supplierPartNumber ?? '',
    purchaseCost: product.purchaseCost ?? 0,
    supplierUrl: product.supplierUrl ?? '',
    internalNotes: product.internalNotes ?? '',
    active: product.active,
    applicationIds: product.applicationIds ?? [],
  }
}

// Cada paso valida solo sus campos antes de dejar avanzar.
const STEPS: Array<{ id: string; label: string; fields: FieldPath<AdminProductValues>[] }> = [
  {
    id: 'basics',
    label: 'Basics',
    fields: ['title', 'partNumber', 'category', 'condition', 'description', 'warranty', 'active'],
  },
  {
    id: 'fitment',
    label: 'Fitment',
    fields: ['make', 'model', 'yearFrom', 'yearTo', 'engine', 'fitment', 'applicationIds'],
  },
  { id: 'pricing', label: 'Pricing', fields: ['price', 'coreCharge'] },
  {
    id: 'shipping',
    label: 'Shipping',
    fields: ['shippingWeight', 'packageLength', 'packageWidth', 'packageHeight'],
  },
  {
    id: 'photos',
    label: 'Photos & notes',
    fields: [
      'image',
      'supplier',
      'supplierPartNumber',
      'purchaseCost',
      'supplierUrl',
      'internalNotes',
    ],
  },
]

function stepOf(field: string): number {
  return STEPS.findIndex((step) => step.fields.some((name) => name === field))
}

type ProductEditorDialogProps = {
  product: AdminProduct | null
  open: boolean
  submitting: boolean
  error: unknown
  canEditPricing: boolean
  canViewCosts: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AdminProductValues) => void
}

export function ProductEditorDialog({
  product,
  open,
  submitting,
  error,
  canEditPricing,
  canViewCosts,
  onOpenChange,
  onSubmit,
}: ProductEditorDialogProps) {
  const schema = useMemo(() => buildAdminProductSchema({ requirePrice: canEditPricing }), [canEditPricing])
  const form = useForm<AdminProductValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? valuesFor(product) : emptyProduct,
    // Al enviar, el foco va al primer campo inválido.
    shouldFocusError: true,
  })
  const generalError = useApiFieldError(form, error)
  // Un producto que ya existe se puede guardar desde cualquier paso.
  const editing = Boolean(product)
  const steps = useFormSteps(STEPS, { free: editing })
  const goToStep = steps.goTo

  // Si el backend rechaza un campo, se abre el paso donde está.
  const rejectedField = error ? friendlyApiError(error).field : undefined
  useEffect(() => {
    const failed = rejectedField ? stepOf(rejectedField) : -1
    if (failed >= 0) goToStep(failed)
    // `goToStep` cambia en cada render; solo importa un error nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, rejectedField])

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    if (submitting) return
    if (form.formState.isDirty && !window.confirm('You have unsaved changes. Discard them?')) return
    onOpenChange(false)
  }

  // Guarda desde cualquier paso; si la validación falla, va al primer paso
  // que tiene un error para que se vea.
  const save = form.handleSubmit(onSubmit, (invalid) => {
    const failed = STEPS.findIndex((step) => step.fields.some((field) => field in invalid))
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

  const errors = form.formState.errors
  const at = (id: string) => STEPS[steps.current].id === id

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-[100dvh] max-w-none gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-2rem)] sm:max-w-5xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12">
          <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>
            One step at a time: basics, fitment, pricing, shipping and photos. Fields marked{' '}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>
        {/* El formulario envuelve el contenido y la barra de pasos: "Next" y
            "Save" son sus botones de submit. */}
        <form
          aria-label="Product"
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
            <StepIndicator
              steps={STEPS}
              current={steps.current}
              reachable={steps.reachable}
              onSelect={steps.goTo}
            />

            <StepPanel active={at('basics')}>
              <fieldset className="space-y-4">
                <legend className="text-lg font-semibold">Basics</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="product-title"
                    label="Title"
                    aria-required
                    error={errors.title?.message}
                    {...form.register('title')}
                  />
                  <FormField
                    id="product-part"
                    label="Part #"
                    aria-required
                    error={errors.partNumber?.message}
                    {...form.register('partNumber')}
                  />
                  <FormField id="product-category" label="Category" {...form.register('category')} />
                  <FormField id="product-condition" label="Condition" {...form.register('condition')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-description">Description</Label>
                  <textarea
                    id="product-description"
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...form.register('description')}
                  />
                </div>
                <FormField id="product-warranty" label="Warranty" {...form.register('warranty')} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register('active')} />
                  Active
                </label>
              </fieldset>
            </StepPanel>

            <StepPanel active={at('fitment')}>
              <fieldset className="space-y-4">
                <legend className="text-lg font-semibold">Fitment</legend>
                <div className="grid gap-4 sm:grid-cols-4">
                  <FormField id="product-make" label="Make" {...form.register('make')} />
                  <FormField id="product-model" label="Model" {...form.register('model')} />
                  <FormField
                    id="product-year-from"
                    label="Year from"
                    inputMode="numeric"
                    placeholder="e.g. 2005"
                    error={errors.yearFrom?.message}
                    {...form.register('yearFrom')}
                  />
                  <FormField
                    id="product-year-to"
                    label="Year to"
                    inputMode="numeric"
                    placeholder="e.g. 2007"
                    error={errors.yearTo?.message}
                    {...form.register('yearTo')}
                  />
                  <FormField id="product-engine" label="Engine" {...form.register('engine')} />
                </div>
                <FormField id="product-fitment" label="Fitment notes" {...form.register('fitment')} />
                <Controller
                  control={form.control}
                  name="applicationIds"
                  render={({ field }) => (
                    <CompatibleVehiclesField value={field.value} onChange={field.onChange} />
                  )}
                />
              </fieldset>
            </StepPanel>

            <StepPanel active={at('pricing')}>
              <fieldset className="space-y-4" disabled={!canEditPricing}>
                <legend className="text-lg font-semibold">Pricing</legend>
                {canEditPricing ? null : (
                  <p className="text-sm text-muted-foreground">
                    Price changes require pricing permission.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="product-price"
                    label="Price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    aria-required={canEditPricing || undefined}
                    error={errors.price?.message}
                    {...form.register('price')}
                  />
                  <FormField
                    id="product-core"
                    label="Core charge"
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.coreCharge?.message}
                    {...form.register('coreCharge', { valueAsNumber: true })}
                  />
                </div>
              </fieldset>
            </StepPanel>

            <StepPanel active={at('shipping')}>
              <fieldset className="space-y-4">
                <legend className="text-lg font-semibold">Shipping</legend>
                <p className="text-sm text-muted-foreground">
                  Weight and package size are used to quote shipping at checkout.
                </p>
                <div className="grid gap-4 sm:grid-cols-4">
                  <FormField
                    id="product-weight"
                    label="Weight (lb)"
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.shippingWeight?.message}
                    {...form.register('shippingWeight', { valueAsNumber: true })}
                  />
                  <FormField
                    id="product-length"
                    label="Length (in)"
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.packageLength?.message}
                    {...form.register('packageLength', { valueAsNumber: true })}
                  />
                  <FormField
                    id="product-width"
                    label="Width (in)"
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.packageWidth?.message}
                    {...form.register('packageWidth', { valueAsNumber: true })}
                  />
                  <FormField
                    id="product-height"
                    label="Height (in)"
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.packageHeight?.message}
                    {...form.register('packageHeight', { valueAsNumber: true })}
                  />
                </div>
              </fieldset>
            </StepPanel>

            <StepPanel active={at('photos')}>
              <fieldset className="space-y-4">
                <legend className="text-lg font-semibold">Photos</legend>
                {product ? (
                  <ProductImagesField productId={product.id} initialImages={product.images ?? []} />
                ) : (
                  // Una foto se guarda en la galería de un producto que ya existe.
                  <p className="text-sm text-muted-foreground">
                    Save the product first, then open it again to add photos.
                  </p>
                )}
                <FormField id="product-image" label="Image URL" {...form.register('image')} />
              </fieldset>
              {canViewCosts ? (
                <fieldset className="space-y-4">
                  <legend className="text-lg font-semibold">Internal</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="product-supplier" label="Supplier" {...form.register('supplier')} />
                    <FormField
                      id="product-supplier-part"
                      label="Supplier part #"
                      {...form.register('supplierPartNumber')}
                    />
                    <FormField
                      id="product-cost"
                      label="Purchase cost"
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={!canEditPricing}
                      error={errors.purchaseCost?.message}
                      {...form.register('purchaseCost', { valueAsNumber: true })}
                    />
                    <FormField
                      id="product-supplier-url"
                      label="Supplier URL"
                      {...form.register('supplierUrl')}
                    />
                  </div>
                  <FormField id="product-notes" label="Internal notes" {...form.register('internalNotes')} />
                </fieldset>
              ) : null}
            </StepPanel>

            {generalError ? (
              <p role="alert" className="text-sm text-destructive">
                {generalError}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <StepNav
              isFirst={steps.isFirst}
              isLast={steps.isLast}
              submitting={submitting}
              saveLabel="Save product"
              saveAnytime={editing}
              onBack={steps.back}
              onSave={() => void save()}
              onCancel={() => handleOpenChange(false)}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
