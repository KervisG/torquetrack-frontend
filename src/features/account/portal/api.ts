import { apiRequest } from '@/lib/api-client'
import { toFulfillmentStatus } from '@/lib/fulfillment'
import type { AccountProfileValues } from '@/lib/validators/account-profile'

import type { AccountOrder, AccountProfile, AccountQuote } from './types'

type RawOrder = Omit<
  AccountOrder,
  | 'createdAt'
  | 'fulfillmentStatus'
  | 'carrier'
  | 'trackingNumber'
  | 'trackingUrl'
  | 'shippedAt'
  | 'deliveredAt'
> & {
  createdAt: string
  fulfillmentStatus?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
}
type RawQuote = Omit<AccountQuote, 'createdAt' | 'expiresAt'> & {
  createdAt: string
  expiresAt: string | null
}

export async function getAccount(): Promise<AccountProfile> {
  const body = await apiRequest<{ customer: AccountProfile }>('/account')
  return body.customer
}

export async function updateAccount(values: AccountProfileValues): Promise<AccountProfile> {
  const body = await apiRequest<{ customer: AccountProfile }>('/account', {
    method: 'PATCH',
    body: JSON.stringify(values),
  })
  return body.customer
}

export async function listAccountOrders(): Promise<AccountOrder[]> {
  const rows = await apiRequest<RawOrder[]>('/account/orders')
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    fulfillmentStatus: toFulfillmentStatus(row.fulfillmentStatus),
    carrier: row.carrier ?? '',
    trackingNumber: row.trackingNumber ?? '',
    trackingUrl: row.trackingUrl ?? null,
    shippedAt: row.shippedAt ? new Date(row.shippedAt) : null,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : null,
  }))
}

export async function listAccountQuotes(): Promise<AccountQuote[]> {
  const rows = await apiRequest<RawQuote[]>('/account/quotes')
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
  }))
}

export function submitTaxExemption(payload: {
  company: string
  taxId: string
  taxState: string
  taxExemptionType: string
  certificateName: string
  certificateData: string
}): Promise<{ ok: true; status: string; submittedAt: string }> {
  return apiRequest('/account/tax-exemption', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
