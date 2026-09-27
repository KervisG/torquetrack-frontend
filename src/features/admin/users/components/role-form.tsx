import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import type { SessionUser } from '@/features/account/auth/types'

import { createRole, updateRole, type RoleWrite } from '../api'
import { ROLE_PERMISSIONS } from '../permissions'
import { adminUserKeys } from '../query-keys'
import type { AdminRole } from '../types'

type RoleFormProps = {
  role?: AdminRole
  actor: SessionUser
  onClose: () => void
}

export function RoleForm({ role, actor, onClose }: RoleFormProps) {
  const queryClient = useQueryClient()
  const actorFullAccess = Boolean(actor.role?.fullAccess)
  const [name, setName] = useState(role?.name ?? '')
  const [fullAccess, setFullAccess] = useState(Boolean(role?.fullAccess))
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? [])
  const save = useMutation({
    mutationFn: (body: RoleWrite) =>
      role ? updateRole(role.slug, body) : createRole(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.roles() })
      onClose()
    },
  })
  const held = new Set(actor.permissions)

  function toggle(code: string) {
    setSelected((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    )
  }

  return (
    <form
      aria-label={role ? `Edit role ${role.name}` : 'New role'}
      className="space-y-4 rounded-md border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate({
          name: name.trim(),
          fullAccess,
          permissions: fullAccess ? [] : selected,
        })
      }}
    >
      <FormField id="role-name" label="Role name" value={name} onChange={(event) => setName(event.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fullAccess}
          disabled={!actorFullAccess}
          onChange={(event) => setFullAccess(event.target.checked)}
        />
        Full access
      </label>
      <fieldset className="grid gap-2 sm:grid-cols-2" disabled={fullAccess}>
        <legend className="mb-1 text-sm font-medium">Permissions</legend>
        {ROLE_PERMISSIONS.map((permission) => {
          const locked = !actorFullAccess && !held.has(permission.code)
          return (
            <label key={permission.code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fullAccess || selected.includes(permission.code)}
                disabled={locked}
                onChange={() => toggle(permission.code)}
              />
              {permission.label}
            </label>
          )
        })}
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending || !name.trim()}>
          {save.isPending ? 'Saving…' : 'Save role'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <FormError error={save.error} />
    </form>
  )
}
