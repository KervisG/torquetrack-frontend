import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { adminCustomerSchema, type AdminCustomerValues } from '@/lib/validators/admin-customer'

import { saveCustomer } from '../api'
import { adminCustomerKeys } from '../query-keys'

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

const FIELDS = [
  ['name', 'Name'],
  ['company', 'Company (optional)'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['address1', 'Street address'],
  ['city', 'City'],
  ['state', 'State'],
  ['zip', 'ZIP'],
] as const

export function CreateCustomerForm() {
  const queryClient = useQueryClient()
  const form = useForm<AdminCustomerValues>({
    resolver: zodResolver(adminCustomerSchema),
    defaultValues: emptyValues,
  })
  const create = useMutation({
    mutationFn: (values: AdminCustomerValues) =>
      saveCustomer({ ...values, state: values.state.toUpperCase() }),
    onSuccess: async () => {
      form.reset(emptyValues)
      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all })
    },
  })
  const errors = form.formState.errors

  return (
    <form
      aria-label="Create customer"
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([field, label]) => (
          <FormField
            key={field}
            id={`new-customer-${field}`}
            label={label}
            type={field === 'email' ? 'email' : 'text'}
            autoComplete="off"
            error={errors[field]?.message}
            {...form.register(field)}
          />
        ))}
      </div>
      <FormError error={create.error} />
      {create.isSuccess ? <p className="text-sm text-muted-foreground">Customer saved.</p> : null}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Saving…' : 'Create customer'}
      </Button>
    </form>
  )
}
