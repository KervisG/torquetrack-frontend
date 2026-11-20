import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/msw-server'

import { createCheckout } from './api'

describe('createCheckout', () => {
  it('sends no shipping: the store ships free', async () => {
    let sent: unknown
    server.use(
      http.post('/api/checkout/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true, url: 'https://pay', orderId: 'o', orderNumber: 'O1', tax: 0 })
      }),
    )

    await createCheckout({
      items: [{ id: 'p1', qty: 1 }],
      vehicle: { vin: '1FT', year: '1996', make: 'Ford', model: 'F-250', engine: '7.3' },
      customer: {
        name: 'Pat',
        email: 'pat@example.com',
        address1: '1 Main',
        city: 'Tampa',
        state: 'FL',
        zip: '33601',
        country: 'US',
      },
    })

    expect(sent).not.toHaveProperty('shipping')
  })
})
