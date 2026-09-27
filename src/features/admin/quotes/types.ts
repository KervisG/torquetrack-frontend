import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'

// Estados que el editor puede fijar. EXPIRED lo pone el listado al vencer y
// CONVERTED el convert; se cambian con sus acciones, no a mano.
export const EDITABLE_QUOTE_STATUSES = ['BUILDING', 'ACTIVE', 'CONTACTED', 'LOST'] as const

export const QUOTE_STATUSES = [...EDITABLE_QUOTE_STATUSES, 'EXPIRED', 'CONVERTED'] as const

export type QuoteCustomer = {
  name: string
  company: string
  email: string
  phone: string
}

export type QuoteVehicle = {
  year: string
  make: string
  model: string
  engine: string
  vin: string
}

export type QuoteShippingAddress = {
  address1: string
  city: string
  state: string
  zip: string
}

// De dónde salió el impuesto guardado; `''` en una cotización anterior a
// que el servidor lo calculara.
export type QuoteTaxSource = 'calculated' | 'exempt' | 'manual' | ''

export type AdminQuote = {
  id: string
  number: string
  status: string
  createdAt: Date
  expiresAt: Date | null
  // Perfil vinculado; `null` en una cotización con solo el snapshot del cliente.
  customerId: string | null
  customer: QuoteCustomer
  vehicle: QuoteVehicle
  items: LineItem[]
  totals: DocumentTotals
  // Lo que se cargó en el editor; el backend recalcula `totals` a partir de esto.
  shipping: number
  tax: number
  shippingAddress: QuoteShippingAddress
  taxSource: QuoteTaxSource
  taxDescription: string
  taxOverrideReason: string
  memo: string
  createdBy: string
  orderNumber: string
  lastEmailedAt: Date | null
  lastEmailedTo: string
}

export function quoteCustomerLabel(customer: QuoteCustomer): string {
  return customer.name || customer.company || customer.email || 'Customer'
}
