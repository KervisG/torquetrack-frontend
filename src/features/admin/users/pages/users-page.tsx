import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { hasAdminPermission } from '@/features/admin/auth/types'

import { deleteUser, listRoles, listUsers } from '../api'
import { EditUserForm } from '../components/edit-user-form'
import { RoleForm } from '../components/role-form'
import { UsersTable } from '../components/users-table'
import { adminUserKeys } from '../query-keys'
import type { AdminRole } from '../types'

export function UsersPage() {
  const session = useSession()
  const user = session.data?.user
  const allowed = user ? hasAdminPermission(user, 'users.manage') : false
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<AdminRole | null | undefined>(undefined)
  const users = useQuery({ queryKey: adminUserKeys.list(), queryFn: listUsers, enabled: allowed })
  const roles = useQuery({ queryKey: adminUserKeys.roles(), queryFn: listRoles, enabled: allowed })
  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async (_result, id) => {
      if (editingId === id) setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })

  const pagedUsers = usePagedRows(users.data ?? [], '')

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
              users={pagedUsers.items}
              currentUserId={user.id}
              deletingId={remove.isPending ? (remove.variables ?? null) : null}
              onEdit={(row) => setEditingId(row.id)}
              onDelete={(row) => remove.mutate(row.id)}
            />
          )}
          <ListPagination
            page={pagedUsers.page}
            pageCount={pagedUsers.pageCount}
            total={pagedUsers.total}
            from={pagedUsers.from}
            to={pagedUsers.to}
            onPage={pagedUsers.setPage}
          />
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">Roles</CardTitle>
          <Button type="button" onClick={() => setEditingRole(null)}>
            New role
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.isPending ? (
            <p className="text-sm text-muted-foreground">Loading roles…</p>
          ) : (
            <table aria-label="Roles" className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Access</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(roles.data ?? []).map((role) => (
                  <tr key={role.slug} className="border-b last:border-0">
                    <td className="py-2 pr-4">{role.name}</td>
                    <td className="py-2 pr-4">{role.fullAccess ? 'Full access' : 'Limited'}</td>
                    <td className="py-2 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingRole(role)}>
                        Edit role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editingRole !== undefined ? (
            <RoleForm
              key={editingRole?.slug ?? 'new'}
              role={editingRole ?? undefined}
              actor={user}
              onClose={() => setEditingRole(undefined)}
            />
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
