import type { FulfillmentStatus } from '@/lib/fulfillment'

export type AccountProfile = {
  id: string
  email: string | null
  name: string
  company: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  country: string
  taxStatus: string
}

export type DocumentTotals = {
  subtotal?: number
  core?: number
  shipping?: number
  tax?: number
  total?: number
}

export type AccountOrder = {
  id: string
  number: string
  status: string
  paymentStatus: string
  createdAt: Date
  totals: DocumentTotals
  fulfillmentStatus: FulfillmentStatus
  carrier: string
  trackingNumber: string
  // Lo arma el backend según el transportista; `null` sin enlace público.
  trackingUrl: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
}

export type AccountQuote = {
  id: string
  number: string
  status: string
  createdAt: Date
  expiresAt: Date | null
  totals: DocumentTotals
}
