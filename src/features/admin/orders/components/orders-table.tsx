import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { fulfillmentBadgeVariant, fulfillmentLabel } from '@/lib/fulfillment'
import { formatMoney } from '@/lib/money'

import { orderCustomerLabel, type AdminOrder } from '../types'

// El total es el que guardó el backend al crear el pedido; nunca se recalcula.
export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">No orders found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table aria-label="Orders" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Number</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 text-right font-medium">Total</th>
            <th className="py-2 pr-4 font-medium">Payment</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Fulfillment</th>
            <th className="py-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <Link
                  to={`/admin/orders/${encodeURIComponent(order.id)}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {order.number}
                </Link>
              </td>
              <td className="py-2 pr-4">{orderCustomerLabel(order.customer)}</td>
              <td className="py-2 pr-4 text-right">{formatMoney(order.totals.total)}</td>
              <td className="py-2 pr-4">
                <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'outline'}>
                  {order.paymentStatus}
                </Badge>
              </td>
              <td className="py-2 pr-4">{order.status}</td>
              <td className="py-2 pr-4">
                <Badge variant={fulfillmentBadgeVariant(order.fulfillmentStatus)}>
                  {fulfillmentLabel(order.fulfillmentStatus)}
                </Badge>
              </td>
              <td className="py-2">{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
