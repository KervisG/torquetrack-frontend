import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'

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
}

export function orderCustomerLabel(customer: OrderCustomer): string {
  return customer.name || customer.company || customer.email || 'Customer'
}
