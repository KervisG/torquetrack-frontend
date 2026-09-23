import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  accountProfileSchema,
  type AccountProfileValues,
} from '@/lib/validators/account-profile'

import { updateAccount } from '../api'
import { accountKeys } from '../query-keys'
import type { AccountProfile } from '../types'

const fields: Array<{ name: keyof AccountProfileValues; label: string; autoComplete: string }> = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'company', label: 'Company', autoComplete: 'organization' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel' },
  { name: 'address1', label: 'Street address', autoComplete: 'address-line1' },
  { name: 'address2', label: 'Apartment, suite, etc.', autoComplete: 'address-line2' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'zip', label: 'ZIP', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country' },
]

export function ProfileForm({ profile }: { profile: AccountProfile }) {
  const queryClient = useQueryClient()
  const form = useForm<AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: {
      name: profile.name,
      company: profile.company,
      phone: profile.phone,
      address1: profile.address1,
      address2: profile.address2,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      country: profile.country,
    },
  })
  const save = useMutation({
    mutationFn: updateAccount,
    onSuccess: (updated) => {
      queryClient.setQueryData(accountKeys.profile(), updated)
    },
  })

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <div>
        <p className="text-sm font-medium">Email</p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FormField
            key={field.name}
            id={`profile-${field.name}`}
            label={field.label}
            autoComplete={field.autoComplete}
            error={form.formState.errors[field.name]?.message}
            {...form.register(field.name)}
          />
        ))}
      </div>
      <FormError error={save.error} />
      {save.isSuccess ? <p className="text-sm text-muted-foreground">Profile saved.</p> : null}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  )
}
