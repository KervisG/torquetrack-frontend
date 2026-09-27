import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'
import { apiRequest } from '@/lib/api-client'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import type { AdminQuote, QuoteShippingAddress, QuoteTaxSource } from './types'

type RawRecord = Record<string, unknown>

type RawQuote = {
  id: string
  number: string
  status: string
  createdAt: string
  expiresAt: string | null
  customerId?: string | null
  customer?: RawRecord | null
  vehicle?: RawRecord | null
  items?: RawRecord[]
  totals?: DocumentTotals
  memo?: string
  shippingAddress?: RawRecord | null
  taxSource?: string
  taxDescription?: string
  taxOverride?: RawRecord | null
  createdBy?: string
  orderNumber?: string
  lastEmailedAt?: string | null
  lastEmailedTo?: string
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return value !== null && value !== undefined && Number.isFinite(parsed) ? parsed : fallback
}

// Las líneas del storefront y del panel usan `quantity`/`unitPrice`; las
// viejas pueden traer `qty`/`price`. Solo se renombran campos.
function toLineItem(item: RawRecord): LineItem {
  return {
    productId: text(item.productId ?? item.id) || undefined,
    title: text(item.title),
    partNumber: text(item.partNumber),
    quantity: num(item.quantity ?? item.qty, 1),
    unitPrice: num(item.unitPrice ?? item.price),
    coreCharge: num(item.coreCharge),
  }
}

function toTaxSource(value: unknown): QuoteTaxSource {
  return value === 'calculated' || value === 'exempt' || value === 'manual' ? value : ''
}

function toQuote(row: RawQuote): AdminQuote {
  const address = row.shippingAddress ?? {}
  const customer = row.customer ?? {}
  const vehicle = row.vehicle ?? {}
  const totals = row.totals ?? {}
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    createdAt: new Date(row.createdAt),
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
    customerId: row.customerId || null,
    customer: {
      name: text(customer.name),
      company: text(customer.company),
      email: text(customer.email),
      phone: text(customer.phone),
    },
    vehicle: {
      year: text(vehicle.year),
      make: text(vehicle.make),
      model: text(vehicle.model),
      engine: text(vehicle.engine),
      vin: text(vehicle.vin),
    },
    items: (row.items ?? []).map(toLineItem),
    totals,
    shipping: num(totals.shipping),
    tax: num(totals.tax),
    shippingAddress: {
      address1: text(address.address1),
      city: text(address.city),
      state: text(address.state),
      zip: text(address.zip),
    },
    taxSource: toTaxSource(row.taxSource),
    taxDescription: text(row.taxDescription),
    taxOverrideReason: text(row.taxOverride?.reason),
    memo: text(row.memo),
    createdBy: text(row.createdBy),
    orderNumber: text(row.orderNumber),
    lastEmailedAt: row.lastEmailedAt ? new Date(row.lastEmailedAt) : null,
    lastEmailedTo: text(row.lastEmailedTo),
  }
}

export async function listQuotes(): Promise<AdminQuote[]> {
  const rows = await apiRequest<RawQuote[]>('/admin/quotes')
  return rows.map(toQuote)
}

// Alta (`id: null`) o edición: el backend reemplaza el contenido y recalcula
// los totales y el impuesto, así que se manda la cotización completa sin
// `tax`. El impuesto solo viaja como `taxOverride`, que el backend acepta
// solo con `tax_exemptions.review` (sin el permiso responde 403).
export function saveQuote(
  payload: AdminQuoteValues & { id: string | null; customerId: string | null },
): Promise<{ updated: boolean; quote: { id: string; number: string } }> {
  const { tax, taxOverride, ...quote } = payload
  const body = taxOverride.enabled
    ? { ...quote, taxOverride: { amount: tax, reason: taxOverride.reason } }
    : quote
  return apiRequest<{ updated: boolean; quote: { id: string; number: string } }>(
    '/admin/quotes',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function decodeQuoteVin(vin: string): Promise<{ vehicle: { vin: string; year: string; make: string; model: string; engine: string } }> {
  return apiRequest('/admin/quotes/vin', {
    method: 'POST',
    body: JSON.stringify({ vin }),
  })
}

// La exención la decide el backend con el cliente de la cotización (`quoteId`,
// `customerId` o el email de una cuenta registrada), no con la sesión del staff.
export function estimateQuoteTax(payload: {
  subtotal: number
  coreCharge: number
  shipping: number
  address: QuoteShippingAddress
  quoteId?: string
  customerId?: string
  email?: string
}): Promise<{ tax: number; rate: number; source: string; exempt?: boolean }> {
  return apiRequest('/admin/quotes/tax', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteQuote(id: string): Promise<{ ok: true; archived: boolean }> {
  return apiRequest<{ ok: true; archived: boolean }>(`/admin/quotes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

function quoteAction<T>(id: string, action: string): Promise<T> {
  return apiRequest<T>(`/admin/quotes/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
}

// Sin proveedor de correo el backend responde 502 con el motivo.
export function sendQuote(id: string): Promise<{ ok: true; url: string }> {
  return quoteAction(id, 'send')
}

// Genera (o reutiliza) el token y devuelve la URL de `/quote/<token>`.
export function getPublicLink(id: string): Promise<{ ok: true; url: string }> {
  return quoteAction(id, 'preview')
}

export function reopenQuote(id: string): Promise<{ ok: true }> {
  return quoteAction(id, 'reopen')
}

export function convertQuote(
  id: string,
): Promise<{ ok: true; existing?: boolean; order: { id: string; number: string } }> {
  return quoteAction(id, 'convert')
}
