import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'
import type { FulfillmentStatus } from '@/lib/fulfillment'

// Estados que acepta `PATCH /api/admin/orders/<id>/`. `CANCELLED` exige
// `orders.cancel`; el resto, `orders.status`.
export const ORDER_STATUSES = [
  'OPEN',
  'PENDING_PAYMENT',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

// El cobro pasa `PENDING_PAYMENT` a `OPEN` solo. Un reembolso no cierra el
// pedido, y el envío no lo marca `COMPLETED`.
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ['CANCELLED', 'REJECTED'],
  OPEN: ['PROCESSING', 'CANCELLED', 'REJECTED'],
  PROCESSING: ['COMPLETED', 'CANCELLED', 'REJECTED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
}

export function nextOrderStatuses(status: string): readonly OrderStatus[] {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return []
  return ORDER_STATUS_TRANSITIONS[status as OrderStatus]
}

export type OrderCustomer = {
  name: string
  company: string
  email: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
}

export type OrderPayment = {
  id: string
  provider: string
  status: string
  amount: number
  source: string
  createdAt: Date
}

// Estados en los que Stripe ya cobró: un reembolso no reabre el cobro.
export const CHARGED_PAYMENT_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']
// Solo desde estos estados el backend acepta un reembolso nuevo.
export const REFUNDABLE_PAYMENT_STATUSES = ['PAID', 'PARTIALLY_REFUNDED']

export type OrderRefund = {
  id: string
  paymentId: string
  amount: number
  status: string
  reason: string
  createdBy: string
  createdAt: Date
}

export type AdminOrder = {
  id: string
  number: string
  status: string
  paymentStatus: string
  createdAt: Date
  customer: OrderCustomer
  items: LineItem[]
  totals: DocumentTotals
  // Transportista y servicio elegidos en el checkout; vacío en un pedido
  // convertido desde una cotización.
  shippingMethod: string
  vehicle: { vin: string; year: string; make: string; model: string; engine: string }
  quoteNumber: string
  payments: OrderPayment[]
  refunds: OrderRefund[]
  // Los dos montos los calcula el backend: el saldo descuenta también los
  // reembolsos que Stripe todavía no confirmó.
  amountRefunded: number
  refundableAmount: number
  // Envío, separado de `status`. `trackingUrl` lo arma el backend según el
  // transportista y es `null` para `OTHER`.
  fulfillmentStatus: FulfillmentStatus
  carrier: string
  trackingNumber: string
  trackingUrl: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
}

// Misma regla que `update_order_fulfillment`: solo avanza un pedido cobrado
// (un reembolso total no cuenta) y no cerrado. El backend la vuelve a aplicar.
const CLOSED_ORDER_STATUSES = ['CANCELLED', 'REJECTED']

export function canFulfill(order: AdminOrder): boolean {
  return (
    CHARGED_PAYMENT_STATUSES.includes(order.paymentStatus) &&
    order.paymentStatus !== 'REFUNDED' &&
    !CLOSED_ORDER_STATUSES.includes(order.status)
  )
}

export function orderCustomerLabel(customer: OrderCustomer): string {
  return customer.name || customer.company || customer.email || 'Customer'
}
