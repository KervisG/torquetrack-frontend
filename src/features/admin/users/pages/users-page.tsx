import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { hasAdminPermission } from '@/features/admin/auth/types'

import { deleteUser, listRoles, listUsers } from '../api'
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
    return <PermissionNotice title="Users" message="You do not have permission to manage users." />
  }

  const editing = users.data?.find((row) => row.id === editingId)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Users"
        description="Accounts register as customers in the store; assign a role here to grant panel access."
      />
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
          {roles.error ? <FormError error={roles.error} /> : null}
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
    </section>
  )
}
