import { useQuery } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'

import { listAccountOrders } from '../api'
import { accountKeys } from '../query-keys'
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
      emptyMessage="No orders yet."
      rows={orders.data.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        createdAt: order.createdAt,
        total: order.totals.total,
        extra: order.paymentStatus,
      }))}
    />
  )
}
