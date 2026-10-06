import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { fulfillmentBadgeVariant, fulfillmentLabel } from '@/lib/fulfillment'
import { formatMoney } from '@/lib/money'
import { STACKED_TABLE } from '@/components/stacked-table'
import { cn } from '@/lib/utils'

import { orderCustomerLabel, type AdminOrder } from '../types'

// El total es el que guardó el backend al crear el pedido; nunca se recalcula.
export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">No orders found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
      <table aria-label="Orders" className={cn('w-full text-left text-sm', STACKED_TABLE)}>
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Number</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Fulfillment</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const name = orderCustomerLabel(order.customer)
            const email = order.customer.email.trim()
            return (
              // El enlace cubre la fila para que cualquier celda abra el pedido,
              // y el nombre accesible sigue siendo solo el número.
              <tr key={order.id} className="group relative border-b border-border/60 last:border-0 hover:bg-muted/50">
              <td data-label="Number" className="px-4 py-4">
                <Link
                  to={`/admin/orders/${encodeURIComponent(order.id)}`}
                  className="font-medium after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {order.number}
                </Link>
              </td>
              <td data-label="Customer" className="px-4 py-4">
                <p>{name}</p>
                {email && email.toLowerCase() !== name.toLowerCase() ? (
                  <p className="text-muted-foreground">{email}</p>
                ) : null}
              </td>
              <td data-label="Total" className="px-4 py-4 text-right">{formatMoney(order.totals.total)}</td>
              <td data-label="Payment" className="px-4 py-4">
                <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'outline'}>
                  {order.paymentStatus}
                </Badge>
              </td>
              <td data-label="Status" className="px-4 py-4">{order.status}</td>
              <td data-label="Fulfillment" className="px-4 py-4">
                <Badge variant={fulfillmentBadgeVariant(order.fulfillmentStatus)}>
                  {fulfillmentLabel(order.fulfillmentStatus)}
                </Badge>
              </td>
              <td data-label="Date" className="px-4 py-4">{formatDate(order.createdAt)}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
