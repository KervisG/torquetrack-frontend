import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { SelectField } from '@/components/select-field'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { deleteCustomer, listCustomers, sendPortalInvite } from '../api'
import { CreateCustomerDialog } from '../components/create-customer-form'
import { CustomersTable } from '../components/customers-table'
import { adminCustomerKeys } from '../query-keys'
import { TAX_STATUSES, type AdminCustomer } from '../types'

const TAX_FILTERS = [
  { value: 'ALL', label: 'All tax statuses' },
  ...TAX_STATUSES.map((status) => ({ value: status, label: status })),
]

// La API no filtra: el listado completo se filtra en el cliente.
function matches(customer: AdminCustomer, search: string, taxStatus: string): boolean {
  if (taxStatus !== 'ALL' && customer.taxStatus !== taxStatus) return false
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [customer.name, customer.company, customer.email, customer.phone]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle))
}

export function CustomersPage() {
  const { can } = useAdminPermissions()
  const allowed = can('customers.view')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [taxStatus, setTaxStatus] = useState('ALL')
  const canCreate = can('customers.edit')
  // `?new=1` llega desde los accesos del dashboard y abre el alta.
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(() => canCreate && params.has('new'))
  const [created, setCreated] = useState(false)
  const customers = useQuery({
    queryKey: adminCustomerKeys.list(),
    queryFn: listCustomers,
    enabled: allowed,
  })
  const invite = useMutation({
    mutationFn: (customer: AdminCustomer) => sendPortalInvite(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.list() })
    },
  })
  const remove = useMutation({
    mutationFn: (customer: AdminCustomer) => deleteCustomer(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all })
    },
  })

  const rows = customers.data?.filter((customer) => matches(customer, search, taxStatus)) ?? []
  const paged = usePagedRows(rows, `${search}|${taxStatus}`)

  function openCreate() {
    setCreated(false)
    setCreating(true)
  }

  if (!allowed) {
    return (
      <PermissionNotice
        title="Customers"
        message="You do not have permission to view customers."
      />
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer profiles, portal invites and tax status."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => openCreate()}>
              New customer
            </Button>
          ) : null
        }
      />
      {canCreate ? (
        <CreateCustomerDialog
          open={creating}
          onOpenChange={(open) => {
            setCreating(open)
            if (!open && params.has('new')) setParams({}, { replace: true })
          }}
          onCreated={() => setCreated(true)}
        />
      ) : null}
      {created ? (
        <p role="status" className="text-sm text-muted-foreground">
          Customer saved.
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="customer-search"
              label="Search customers"
              placeholder="Name, company, email or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectField
              id="customer-tax-filter"
              label="Tax status"
              options={TAX_FILTERS}
              value={taxStatus}
              onChange={(event) => setTaxStatus(event.target.value)}
            />
          </div>
          {customers.isPending ? (
            <p className="text-sm text-muted-foreground">Loading customers…</p>
          ) : customers.error ? (
            <FormError error={customers.error} />
          ) : !customers.data.length ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add customers to prepare quotes, send portal invites and track tax exemptions."
              action={
                canCreate ? (
                  <Button type="button" onClick={() => openCreate()}>
                    Add customer
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <CustomersTable
                customers={paged.items}
                canInvite={can('customers.edit')}
                canDelete={can('customers.delete')}
                invitingId={invite.isPending ? (invite.variables?.id ?? null) : null}
                deletingId={remove.isPending ? (remove.variables?.id ?? null) : null}
                onInvite={(customer) => invite.mutate(customer)}
                onDelete={(customer) => remove.mutate(customer)}
              />
              <ListPagination
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                from={paged.from}
                to={paged.to}
                onPage={paged.setPage}
              />
            </>
          )}
          <FormError error={invite.error ?? remove.error} />
          {invite.data && invite.variables ? (
            <div className="space-y-2 rounded-md border p-4">
              <p className="text-sm">
                Invite ready for {invite.variables.email}. Share this activation link with the
                customer; it expires in 7 days.
              </p>
              <FormField
                id="activation-url"
                aria-label={`Activation link for ${invite.variables.email}`}
                readOnly
                value={invite.data.activationUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
