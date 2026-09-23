import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { createUserSchema, type CreateUserValues } from '@/lib/validators/admin-user'

import { createUser } from '../api'
import { adminUserKeys } from '../query-keys'
import type { AdminRole } from '../types'
import { RoleSelect } from './role-select'

const emptyValues: CreateUserValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: '',
}

export function CreateUserForm({ roles }: { roles: AdminRole[] }) {
  const queryClient = useQueryClient()
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: emptyValues,
  })
  const create = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      form.reset(emptyValues)
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })
  const errors = form.formState.errors

  return (
    <form
      aria-label="Create user"
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="new-user-email"
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          id="new-user-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <FormField
          id="new-user-first-name"
          label="First name"
          error={errors.firstName?.message}
          {...form.register('firstName')}
        />
        <FormField
          id="new-user-last-name"
          label="Last name"
          error={errors.lastName?.message}
          {...form.register('lastName')}
        />
        <RoleSelect
          id="new-user-role"
          roles={roles}
          emptyLabel="Choose a role…"
          error={errors.role?.message}
          {...form.register('role')}
        />
      </div>
      <FormError error={create.error} />
      {create.isSuccess ? <p className="text-sm text-muted-foreground">User created.</p> : null}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creating…' : 'Create user'}
      </Button>
    </form>
  )
}
