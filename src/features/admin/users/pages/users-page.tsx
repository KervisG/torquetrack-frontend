import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { hasAdminPermission } from '@/features/admin/auth/types'

import { deleteUser, listRoles, listUsers } from '../api'
import { CreateUserForm } from '../components/create-user-form'
import { EditUserForm } from '../components/edit-user-form'
import { UsersTable } from '../components/users-table'
import { adminUserKeys } from '../query-keys'

export function UsersPage() {
  const session = useSession()
  const user = session.data?.user
  const allowed = user ? hasAdminPermission(user, 'users.manage') : false
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const users = useQuery({ queryKey: adminUserKeys.list(), queryFn: listUsers, enabled: allowed })
  const roles = useQuery({ queryKey: adminUserKeys.roles(), queryFn: listRoles, enabled: allowed })
  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async (_result, id) => {
      if (editingId === id) setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })

  if (!allowed || !user) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have permission to manage users.
        </p>
      </section>
    )
  }

  const editing = users.data?.find((row) => row.id === editingId)

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.isPending ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : users.error ? (
            <FormError error={users.error} />
          ) : (
            <UsersTable
              users={users.data}
              currentUserId={user.id}
              deletingId={remove.isPending ? (remove.variables ?? null) : null}
              onEdit={(row) => setEditingId(row.id)}
              onDelete={(row) => remove.mutate(row.id)}
            />
          )}
          <FormError error={remove.error} />
          {editing ? (
            <EditUserForm
              key={editing.id}
              user={editing}
              roles={roles.data ?? []}
              onClose={() => setEditingId(null)}
            />
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create user</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.error ? (
            <FormError error={roles.error} />
          ) : (
            <CreateUserForm roles={roles.data ?? []} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
