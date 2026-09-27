import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { editUserSchema, type EditUserValues } from '@/lib/validators/admin-user'

import { updateUser } from '../api'
import { adminUserKeys } from '../query-keys'
import type { AdminRole, AdminUser } from '../types'
import { RoleSelect } from './role-select'

type EditUserFormProps = {
  user: AdminUser
  roles: AdminRole[]
  onClose: () => void
}

export function EditUserForm({ user, roles, onClose }: EditUserFormProps) {
  const queryClient = useQueryClient()
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { role: user.role?.slug ?? '', active: user.active },
  })
  const save = useMutation({
    mutationFn: ({ role, active }: EditUserValues) =>
      updateUser(user.id, { role: role || null, active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })

  return (
    <form
      aria-label={`Edit ${user.email}`}
      className="space-y-4 rounded-md border p-4"
      noValidate
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <p className="font-medium">Edit {user.email}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <RoleSelect
          id={`edit-role-${user.id}`}
          roles={roles}
          emptyLabel="Customer (no panel access)"
          {...form.register('role')}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register('active')} />
        Active
      </label>
      <FormError error={save.error} />
      {save.isSuccess ? <p className="text-sm text-muted-foreground">User updated.</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </form>
  )
}
