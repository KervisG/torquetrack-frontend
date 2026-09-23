import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { LineItemsTable } from '@/components/line-items-table'
import { TotalsSummary } from '@/components/totals-summary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { formatDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'

import { listOrders } from '../api'
import { OrderStatusForm } from '../components/order-status-form'
import { PaymentActions } from '../components/payment-actions'
import { adminOrderKeys } from '../query-keys'
import type { AdminOrder, OrderPayment } from '../types'

// La API no tiene un GET por id: el detalle sale del listado (y de su cache).
export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('orders.view')
  const orders = useQuery({
    queryKey: adminOrderKeys.list(),
    queryFn: listOrders,
    enabled: allowed,
  })

  if (!allowed) {
    return <PermissionNotice title="Order" message="You do not have permission to view orders." />
  }

  const back = (
    <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
      ← All orders
    </Link>
  )

  if (orders.isPending) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>
  }
  if (orders.error) {
    return <FormError error={orders.error} />
  }

  const order = orders.data.find((row) => row.id === id)
  if (!order) {
    return (
      <section className="space-y-3">
        {back}
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </section>
    )
  }

  const canChangeStatus = can('orders.status')
  const canCancel = can('orders.cancel')

  return (
    <section className="space-y-6">
      {back}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Order {order.number}</h1>
        <Badge variant="outline">{order.status}</Badge>
        <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'outline'}>
          {order.paymentStatus}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Placed {formatDate(order.createdAt)}
        {order.quoteNumber ? ` · From quote ${order.quoteNumber}` : ''}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Customer">
          <CustomerDetails order={order} />
        </Section>
        <Section title="Shipping & vehicle">
          <dl className="space-y-3 text-sm">
            <Detail label="Shipping method" value={order.shippingMethod} />
            <Detail label="Vehicle" value={vehicleLabel(order)} />
          </dl>
        </Section>
      </div>
      <Section title="Items">
        <LineItemsTable items={order.items} />
        <div className="ml-auto mt-4 max-w-xs">
          <TotalsSummary totals={order.totals} />
        </div>
      </Section>
      <Section title="Payments">
        <PaymentsTable payments={order.payments} />
        <div className="mt-4">
          {order.paymentStatus === 'PAID' ? (
            <p className="text-sm text-muted-foreground">This order is paid.</p>
          ) : can('payments.take') ? (
            <PaymentActions orderId={order.id} />
          ) : null}
        </div>
      </Section>
      {canChangeStatus || canCancel ? (
        <Section title="Status">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            canChange={canChangeStatus}
            canCancel={canCancel}
          />
        </Section>
      ) : null}
    </section>
  )
}

function vehicleLabel(order: AdminOrder): string {
  const { year, make, model, engine, vin } = order.vehicle
  const name = [year, make, model, engine].filter(Boolean).join(' ')
  return [name, vin ? `VIN ${vin}` : ''].filter(Boolean).join(' · ')
}

function CustomerDetails({ order }: { order: AdminOrder }) {
  const { customer } = order
  const address = [
    customer.address1,
    customer.address2,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Detail label="Name" value={customer.name} />
      <Detail label="Company" value={customer.company} />
      <Detail label="Email" value={customer.email} />
      <Detail label="Phone" value={customer.phone} />
      <div className="sm:col-span-2">
        <Detail label="Address" value={address} />
      </div>
    </dl>
  )
}

function PaymentsTable({ payments }: { payments: OrderPayment[] }) {
  if (!payments.length) {
    return <p className="text-sm text-muted-foreground">No payments yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table aria-label="Payments" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Provider</th>
            <th className="py-2 pr-4 font-medium">Source</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{formatDate(payment.createdAt)}</td>
              <td className="py-2 pr-4">{payment.provider}</td>
              <td className="py-2 pr-4">{payment.source || 'Checkout'}</td>
              <td className="py-2 pr-4">{payment.status}</td>
              <td className="py-2 text-right">{formatMoney(payment.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
