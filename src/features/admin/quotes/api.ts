import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'
import { apiRequest } from '@/lib/api-client'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import type { AdminQuote } from './types'

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

function toQuote(row: RawQuote): AdminQuote {
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
// los totales, así que se manda la cotización completa.
export function saveQuote(
  payload: AdminQuoteValues & { id: string | null; customerId: string | null },
): Promise<{ updated: boolean; quote: { id: string; number: string } }> {
  return apiRequest<{ updated: boolean; quote: { id: string; number: string } }>(
    '/admin/quotes',
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function decodeQuoteVin(vin: string): Promise<{ vehicle: { vin: string; year: string; make: string; model: string; engine: string } }> {
  return apiRequest('/admin/quotes/vin', {
    method: 'POST',
    body: JSON.stringify({ vin }),
  })
}

export function estimateQuoteTax(payload: {
  subtotal: number
  coreCharge: number
  shipping: number
  state: string
  zip: string
}): Promise<{ tax: number; rate: number; source: string }> {
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
