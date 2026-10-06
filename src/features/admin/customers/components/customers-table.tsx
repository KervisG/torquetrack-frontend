import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { STACKED_TABLE } from '@/components/stacked-table'
import { cn } from '@/lib/utils'

import { customerLabel, portalLabel, type AdminCustomer } from '../types'

type CustomersTableProps = {
  customers: AdminCustomer[]
  canInvite: boolean
  canDelete: boolean
  invitingId: string | null
  deletingId: string | null
  onInvite: (customer: AdminCustomer) => void
  onDelete: (customer: AdminCustomer) => void
}

// Presentacional: la confirmación de borrado es estado de la fila; las
// mutaciones y sus errores los maneja la página.
export function CustomersTable({
  customers,
  canInvite,
  canDelete,
  invitingId,
  deletingId,
  onInvite,
  onDelete,
}: CustomersTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (!customers.length) {
    return <p className="text-sm text-muted-foreground">No customers found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table aria-label="Customers" className={cn('w-full text-left text-sm', STACKED_TABLE)}>
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Company</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Tax status</th>
            <th className="py-2 pr-4 font-medium">Portal</th>
            <th className="py-2 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b last:border-0">
              <td data-label="Name" className="py-2 pr-4">
                <Link
                  to={`/admin/customers/${encodeURIComponent(customer.id)}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {customerLabel(customer)}
                </Link>
              </td>
              <td data-label="Company" className="py-2 pr-4">{customer.company || '—'}</td>
              <td data-label="Email" className="py-2 pr-4">{customer.email || '—'}</td>
              <td data-label="Tax status" className="py-2 pr-4">
                <Badge variant={customer.taxStatus === 'VERIFIED' ? 'secondary' : 'outline'}>
                  {customer.taxStatus}
                </Badge>
              </td>
              <td data-label="Portal" className="py-2 pr-4">{portalLabel(customer.portalStatus)}</td>
              <td data-label="" className="py-2 text-right">
                <div className="flex justify-end gap-2">
                  {confirmingId === customer.id ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === customer.id}
                        onClick={() => {
                          setConfirmingId(null)
                          onDelete(customer)
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
                    <>
                      {canInvite && customer.portalStatus !== 'ACTIVE' && customer.email ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={invitingId === customer.id}
                          onClick={() => onInvite(customer)}
                        >
                          Send portal invite
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingId(customer.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </>
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
