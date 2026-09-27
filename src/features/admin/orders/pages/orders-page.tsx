import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { SelectField } from '@/components/select-field'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listOrders } from '../api'
import { OrdersTable } from '../components/orders-table'
import { adminOrderKeys } from '../query-keys'
import type { AdminOrder } from '../types'

function optionsFor(values: string[], allLabel: string) {
  return [
    { value: 'ALL', label: allLabel },
    ...[...new Set(values)].sort().map((value) => ({ value, label: value })),
  ]
}

// La API no filtra ni pagina: el listado completo se filtra en el cliente.
function matches(order: AdminOrder, search: string, status: string, payment: string): boolean {
  if (status !== 'ALL' && order.status !== status) return false
  if (payment !== 'ALL' && order.paymentStatus !== payment) return false
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [
    order.number,
    order.quoteNumber,
    order.customer.name,
    order.customer.company,
    order.customer.email,
    order.vehicle.vin,
    ...order.items.map((item) => item.partNumber),
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

export function OrdersPage() {
  const { can } = useAdminPermissions()
  const allowed = can('orders.view')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [payment, setPayment] = useState('ALL')
  const orders = useQuery({
    queryKey: adminOrderKeys.list(),
    queryFn: listOrders,
    enabled: allowed,
  })

  const all = orders.data ?? []
  const rows = [...all].reverse().filter((order) => matches(order, search, status, payment))
  const paged = usePagedRows(rows, `${search}|${status}|${payment}`)

  if (!allowed) {
    return <PermissionNotice title="Orders" message="You do not have permission to view orders." />
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" description="Every order placed in the store, newest first." />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="order-search"
              label="Search orders"
              placeholder="Number, customer, VIN or part"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectField
              id="order-status-filter"
              label="Status"
              options={optionsFor(
                all.map((order) => order.status),
                'All statuses',
              )}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
            <SelectField
              id="order-payment-filter"
              label="Payment status"
              options={optionsFor(
                all.map((order) => order.paymentStatus),
                'All payment statuses',
              )}
              value={payment}
              onChange={(event) => setPayment(event.target.value)}
            />
          </div>
          {orders.isPending ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : orders.error ? (
            <FormError error={orders.error} />
          ) : (
            <>
              <OrdersTable orders={paged.items} />
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
        </CardContent>
      </Card>
    </section>
  )
}
