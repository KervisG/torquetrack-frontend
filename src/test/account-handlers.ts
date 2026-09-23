import { http, HttpResponse } from 'msw'

import type { AccountProfile } from '@/features/account/portal/types'

export const sampleProfile: AccountProfile = {
  id: 'C_PAT',
  email: 'pat@example.com',
  name: 'Pat Fleet',
  company: 'Fleet LLC',
  phone: '555-0100',
  address1: '100 Main St',
  address2: '',
  city: 'Tampa',
  state: 'FL',
  zip: '33601',
  country: 'US',
  taxStatus: 'NOT SUBMITTED',
}

export function accountOk(profile: AccountProfile = sampleProfile) {
  return http.get('/api/account/', () => HttpResponse.json({ customer: profile }))
}

export function accountOrdersOk() {
  return http.get('/api/account/orders/', () =>
    HttpResponse.json([
      {
        id: 'OID1',
        number: 'O10001',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'UNPAID',
        createdAt: '2026-09-01T15:00:00Z',
        items: [{ id: 'p1', title: 'Injection Pump', qty: 1 }],
        totals: { subtotal: 189.99, core: 25, shipping: 0, tax: 12.9, total: 227.89 },
        vehicle: {},
        shipping: {},
      },
    ]),
  )
}

export function accountQuotesOk() {
  return http.get('/api/account/quotes/', () =>
    HttpResponse.json([
      {
        id: 'QID1',
        number: 'Q10001',
        status: 'BUILDING',
        createdAt: '2026-09-02T15:00:00Z',
        expiresAt: '2026-10-02T15:00:00Z',
        items: [],
        totals: { total: 579 },
        vehicle: {},
      },
    ]),
  )
}
