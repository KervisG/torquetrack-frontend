import { useQuery } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { carrierLabel, fulfillmentLabel } from '@/lib/fulfillment'

import { listAccountOrders } from '../api'
import { accountKeys } from '../query-keys'
import type { AccountOrder } from '../types'
import { DocumentsTable } from './documents-table'

export function OrdersPanel() {
  const orders = useQuery({ queryKey: accountKeys.orders(), queryFn: listAccountOrders })

  if (orders.isPending) return <p className="text-sm text-muted-foreground">Loading orders…</p>
  if (orders.error) return <FormError error={orders.error} />

  return (
    <DocumentsTable
      label="Orders"
      numberLabel="Order"
      extraLabel="Payment"
      shipmentLabel="Shipping"
      emptyMessage="No orders yet."
      rows={orders.data.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        createdAt: order.createdAt,
        total: order.totals.total,
        extra: order.paymentStatus,
        shipment: <Shipment order={order} />,
      }))}
    />
  )
}

// El enlace de seguimiento viene armado del backend; un transportista sin
// página pública (`OTHER`) muestra solo el número de guía.
function Shipment({ order }: { order: AccountOrder }) {
  const label = fulfillmentLabel(order.fulfillmentStatus)
  if (!order.trackingNumber) return <span>{label}</span>

  return (
    <span className="block">
      <span className="block">{label}</span>
      <span className="block text-xs text-muted-foreground">
        {carrierLabel(order.carrier)}{' '}
        {order.trackingUrl ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Track {order.trackingNumber}
          </a>
        ) : (
          order.trackingNumber
        )}
      </span>
    </span>
  )
}
