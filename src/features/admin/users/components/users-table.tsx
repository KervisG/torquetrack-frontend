import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { STACKED_TABLE } from '@/components/stacked-table'
import { cn } from '@/lib/utils'

import { userDisplayName, type AdminUser } from '../types'

type UsersTableProps = {
  users: AdminUser[]
  currentUserId: string
  deletingId: string | null
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

// Presentacional: la confirmación de borrado es estado de la fila; la
// mutación y sus errores los maneja la página.
export function UsersTable({
  users,
  currentUserId,
  deletingId,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (!users.length) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table aria-label="Users" className={cn('w-full text-left text-sm', STACKED_TABLE)}>
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-0">
              <td data-label="Email" className="py-2 pr-4">{user.email}</td>
              <td data-label="Name" className="py-2 pr-4">{userDisplayName(user) || '—'}</td>
              <td data-label="Role" className="py-2 pr-4">{user.role ? user.role.name : 'Customer'}</td>
              <td data-label="Status" className="py-2 pr-4">
                <Badge variant={user.active ? 'secondary' : 'outline'}>
                  {user.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td data-label="" className="py-2 text-right">
                <div className="flex justify-end gap-2">
                  {confirmingId === user.id ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === user.id}
                        onClick={() => {
                          setConfirmingId(null)
                          onDelete(user)
                        }}
                      >
                        Confirm delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    // El backend no deja cambiar el Role ni el estado de la propia
                    // cuenta ni borrarla, así que la fila propia no tiene acciones.
                    user.id !== currentUserId ? (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(user)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingId(user.id)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : null
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
