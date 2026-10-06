import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { useApiFieldError } from '@/components/use-api-field-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { US_STATE_OPTIONS } from '@/lib/us-states'
import { adminCustomerSchema, type AdminCustomerValues } from '@/lib/validators/admin-customer'

import { saveCustomer } from '../api'
import { adminCustomerKeys } from '../query-keys'

const FORM_ID = 'create-customer-form'

const emptyValues: AdminCustomerValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
}

const TEXT_FIELDS = [
  ['name', 'Name', true],
  ['company', 'Company (optional)', false],
  ['email', 'Email', false],
  ['phone', 'Phone', false],
  ['address1', 'Street address', false],
  ['city', 'City', false],
] as const

type CreateCustomerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

// Mismo patrón que el alta de productos y cotizaciones: modal con el
// formulario y el pie de acciones fijo.
export function CreateCustomerDialog({ open, onOpenChange, onCreated }: CreateCustomerDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<AdminCustomerValues>({
    resolver: zodResolver(adminCustomerSchema),
    defaultValues: emptyValues,
    shouldFocusError: true,
  })
  const create = useMutation({
    mutationFn: (values: AdminCustomerValues) =>
      saveCustomer({ ...values, state: values.state.toUpperCase() }),
    onSuccess: async () => {
      form.reset(emptyValues)
      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all })
      onCreated?.()
      onOpenChange(false)
    },
  })
  const generalError = useApiFieldError(form, create.error)
  const errors = form.formState.errors

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    if (create.isPending) return
    if (form.formState.isDirty && !window.confirm('You have unsaved changes. Discard them?')) return
    form.reset(emptyValues)
    create.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[100dvh] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12">
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            Contact and address details. Fields marked <span className="text-destructive">*</span>{' '}
            are required.
          </DialogDescription>
        </DialogHeader>
        <form
          id={FORM_ID}
          aria-label="Create customer"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
          noValidate
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(([field, label, required]) => (
              <FormField
                key={field}
                id={`new-customer-${field}`}
                label={label}
                type={field === 'email' ? 'email' : 'text'}
                autoComplete="off"
                aria-required={required || undefined}
                error={errors[field]?.message}
                {...form.register(field)}
              />
            ))}
            <SelectField
              id="new-customer-state"
              label="State"
              options={US_STATE_OPTIONS}
              error={errors.state?.message}
              {...form.register('state')}
            />
            <FormField
              id="new-customer-zip"
              label="ZIP"
              inputMode="numeric"
              autoComplete="off"
              error={errors.zip?.message}
              {...form.register('zip')}
            />
          </div>
          {generalError ? (
            <p role="alert" className="text-sm text-destructive">
              {generalError}
            </p>
          ) : null}
        </form>
        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={create.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Create customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
