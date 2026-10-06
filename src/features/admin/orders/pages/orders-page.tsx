import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { SelectField } from '@/components/select-field'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listOrders } from '../api'
import { CustomerDetails } from '../components/customer-details'
import { OrdersTable } from '../components/orders-table'
import { adminOrderKeys } from '../query-keys'
import { orderCustomerLabel, type AdminOrder } from '../types'

function optionsFor(values: string[], allLabel: string) {
  return [
    { value: 'ALL', label: allLabel },
    ...[...new Set(values)].sort().map((value) => ({ value, label: value })),
  ]
}

// El correo agrupa al mismo cliente aunque el nombre se haya escrito distinto.
function customerKey(order: AdminOrder): string {
  const email = order.customer.email.trim().toLowerCase()
  if (email) return `email:${email}`
  return `name:${orderCustomerLabel(order.customer).toLowerCase()}`
}

function customerOptionLabel(order: AdminOrder): string {
  const label = orderCustomerLabel(order.customer)
  const email = order.customer.email.trim()
  if (email && label.toLowerCase() !== email.toLowerCase()) return `${label} · ${email}`
  return label
}

function customerOptions(orders: AdminOrder[]) {
  const labels = new Map<string, string>()
  for (const order of orders) {
    const key = customerKey(order)
    if (!labels.has(key)) labels.set(key, customerOptionLabel(order))
  }
  return [
    { value: 'ALL', label: 'All customers' },
    ...[...labels.entries()]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
  ]
}

// La API solo filtra por día (`?date=today`) y no pagina: el resto se filtra en el cliente.
function matches(order: AdminOrder, search: string, status: string, payment: string, customer: string): boolean {
  if (status !== 'ALL' && order.status !== status) return false
  if (payment !== 'ALL' && order.paymentStatus !== payment) return false
  if (customer !== 'ALL' && customerKey(order) !== customer) return false
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [
    order.number,
    order.quoteNumber,
    order.customer.name,
    order.customer.company,
    order.customer.email,
    order.customer.phone,
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
  const [customer, setCustomer] = useState('ALL')
  // `?date=today` viene de la tarjeta "Sales today" del dashboard; "hoy" lo
  // resuelve la API en la zona de la tienda, no el navegador.
  const [params, setParams] = useSearchParams()
  const onlyToday = params.get('date') === 'today'
  const orders = useQuery({
    queryKey: onlyToday ? adminOrderKeys.listByDate('today') : adminOrderKeys.list(),
    queryFn: () => listOrders(onlyToday ? 'today' : undefined),
    enabled: allowed,
  })

  const all = orders.data ?? []
  const rows = [...all]
    .reverse()
    .filter((order) => matches(order, search, status, payment, customer))
  const paged = usePagedRows(rows, `${search}|${status}|${payment}|${customer}|${onlyToday}`)

  if (!allowed) {
    return <PermissionNotice title="Orders" message="You do not have permission to view orders." />
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" description="Every order placed in the store, newest first." />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            id="order-search"
            label="Search orders"
            placeholder="Name, email, number or part"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <SelectField
            id="order-customer-filter"
            label="Customer"
            options={customerOptions(all)}
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
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
        {onlyToday ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border px-3 py-1">Placed today (store time)</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('date')
                setParams(next, { replace: true })
              }}
            >
              Show all dates
            </Button>
          </div>
        ) : null}
        {customer !== 'ALL' && rows[0] ? (
          // Cada pedido guarda su propia copia del cliente; al filtrar se muestra la más reciente.
          <section aria-label="Customer" className="rounded-lg border border-foreground/15 bg-background p-5">
            <h2 className="text-base font-semibold">Customer</h2>
            <div className="mt-4">
              <CustomerDetails customer={rows[0].customer} />
            </div>
          </section>
        ) : null}
        {orders.isPending ? (
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        ) : orders.error ? (
          <FormError error={orders.error} />
        ) : !all.length && onlyToday ? (
          <EmptyState
            icon={Package}
            title="No orders today"
            description="Orders placed today in the store's time zone appear here."
          />
        ) : !all.length ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Orders placed in the store or converted from quotes appear here."
            action={
              can('quotes.create') ? (
                <Button asChild>
                  <Link to="/admin/quotes?new=1">Create a quote</Link>
                </Button>
              ) : null
            }
          />
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
      </div>
    </section>
  )
}
