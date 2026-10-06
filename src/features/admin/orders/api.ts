import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'
import { apiRequest } from '@/lib/api-client'
import { toFulfillmentStatus, type Carrier } from '@/lib/fulfillment'

import type { AdminOrder, OrderCustomer, OrderRefund } from './types'

type RawRecord = Record<string, unknown>

type RawOrder = {
  id: string
  number: string
  status: string
  paymentStatus: string
  createdAt: string
  customer?: RawRecord | null
  items?: RawRecord[]
  totals?: DocumentTotals
  shipping?: unknown
  vehicle?: RawRecord
  quoteNumber?: string
  payments?: Array<{
    id: string
    provider: string
    status: string
    amount: number
    source?: string
    createdAt: string
  }>
  refunds?: RawRefund[]
  amountRefunded?: number
  refundableAmount?: number
  fulfillmentStatus?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
}

type RawRefund = Omit<OrderRefund, 'createdAt'> & { createdAt: string }

function toRefund(row: RawRefund): OrderRefund {
  return { ...row, createdAt: new Date(row.createdAt) }
}

function optionalDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// El checkout guarda `qty`/`price`; un pedido convertido desde una
// cotización trae `quantity`/`unitPrice`. Solo se renombran campos.
function toLineItem(item: RawRecord): LineItem {
  return {
    productId: text(item.id ?? item.productId) || undefined,
    title: text(item.title),
    partNumber: text(item.partNumber),
    quantity: num(item.qty ?? item.quantity ?? 1),
    unitPrice: num(item.price ?? item.unitPrice),
    coreCharge: num(item.coreCharge),
  }
}

function toCustomer(raw: RawRecord | null | undefined): OrderCustomer {
  const customer = raw ?? {}
  return {
    name: text(customer.name),
    company: text(customer.company),
    email: text(customer.email),
    phone: text(customer.phone),
    address1: text(customer.address1),
    address2: text(customer.address2),
    city: text(customer.city),
    state: text(customer.state),
    zip: text(customer.zip),
  }
}

function shippingMethod(shipping: unknown): string {
  if (!shipping || typeof shipping !== 'object') return ''
  const { carrier, service } = shipping as RawRecord
  return [text(carrier), text(service)].filter(Boolean).join(' · ')
}

function toOrder(row: RawOrder): AdminOrder {
  const vehicle = row.vehicle ?? {}
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    paymentStatus: row.paymentStatus,
    createdAt: new Date(row.createdAt),
    customer: toCustomer(row.customer),
    items: (row.items ?? []).map(toLineItem),
    totals: row.totals ?? {},
    shippingMethod: shippingMethod(row.shipping),
    vehicle: {
      vin: text(vehicle.vin),
      year: text(vehicle.year),
      make: text(vehicle.make),
      model: text(vehicle.model),
      engine: text(vehicle.engine),
    },
    quoteNumber: text(row.quoteNumber),
    payments: (row.payments ?? []).map((payment) => ({
      ...payment,
      source: payment.source ?? '',
      createdAt: new Date(payment.createdAt),
    })),
    refunds: (row.refunds ?? []).map(toRefund),
    amountRefunded: num(row.amountRefunded),
    refundableAmount: num(row.refundableAmount),
    fulfillmentStatus: toFulfillmentStatus(row.fulfillmentStatus),
    carrier: text(row.carrier),
    trackingNumber: text(row.trackingNumber),
    trackingUrl: row.trackingUrl ?? null,
    shippedAt: optionalDate(row.shippedAt),
    deliveredAt: optionalDate(row.deliveredAt),
  }
}

// `today` lo resuelve la API en la zona de la tienda (`STORE_TIME_ZONE`), el
// mismo día de "Sales today"; el navegador no calcula la fecha.
export type OrderDateFilter = 'today'

export async function listOrders(date?: OrderDateFilter): Promise<AdminOrder[]> {
  const rows = await apiRequest<RawOrder[]>(date ? `/admin/orders?date=${date}` : '/admin/orders')
  return rows.map(toOrder)
}

export function updateOrderStatus(id: string, status: string): Promise<{ ok: true; status: string }> {
  return apiRequest<{ ok: true; status: string }>(`/admin/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// `emailed: false` cuando el pedido no tiene email o el correo no está
// configurado: el panel muestra el enlace para compartirlo a mano.
export function createPaymentLink(id: string): Promise<{ ok: true; url: string; emailed: boolean }> {
  return apiRequest<{ ok: true; url: string; emailed: boolean }>(
    `/admin/orders/${encodeURIComponent(id)}/payment-link`,
    { method: 'POST' },
  )
}

export function takePayment(id: string): Promise<{ ok: true; url: string }> {
  return apiRequest<{ ok: true; url: string }>(
    `/admin/orders/${encodeURIComponent(id)}/take-payment`,
    { method: 'POST' },
  )
}

// Sin `amount` el backend reembolsa el saldo completo.
export async function refundOrder(
  id: string,
  body: { amount?: number; reason?: string },
): Promise<OrderRefund> {
  const row = await apiRequest<RawRefund>(`/admin/orders/${encodeURIComponent(id)}/refunds`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return toRefund(row)
}

export type FulfillmentUpdate =
  | { status: 'PREPARING' | 'DELIVERED' }
  | { status: 'SHIPPED'; carrier: Carrier; trackingNumber: string }

// Enviar `SHIPPED` otra vez con otra guía la corrige y vuelve a avisar al
// cliente; el backend guarda la fecha del primer despacho.
export function updateFulfillment(
  id: string,
  body: FulfillmentUpdate,
): Promise<{ fulfillmentStatus: string }> {
  return apiRequest<{ fulfillmentStatus: string }>(
    `/admin/orders/${encodeURIComponent(id)}/fulfillment`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}
