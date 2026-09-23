import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/msw-server'

import { createCheckout, getShippingRates, toShippingSelection } from './api'

// El backend arma el paquete con el peso y las medidas del catálogo: el SPA
// manda solo qué productos y cuántos.
describe('getShippingRates', () => {
  it('sends the cart items and no parcel', async () => {
    let sent: unknown
    server.use(
      http.post('/api/shipping/rates/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ configured: true })
      }),
    )

    await getShippingRates({
      to: { zip: '33601' },
      items: [
        { id: 'p1', qty: 2 },
        { id: 'p2', qty: 1 },
      ],
    })

    expect(sent).toEqual({
      to: { zip: '33601' },
      items: [
        { id: 'p1', qty: 2 },
        { id: 'p2', qty: 1 },
      ],
    })
  })
})

// El backend cobra solo la tarifa que cotizó: el SPA manda qué tarifa eligió
// (shipment + rate), nunca el monto.
describe('toShippingSelection', () => {
  it('keeps only the shipment and rate ids of a quoted rate', () => {
    expect(
      toShippingSelection({
        id: 'rate_ground',
        shipmentId: 'shp_1',
        carrier: 'USPS',
        service: 'Ground Advantage',
        rate: 8.5,
      }),
    ).toEqual({ shipmentId: 'shp_1', rateId: 'rate_ground' })
  })

  it('rejects a rate that the server cannot verify', () => {
    // Una tarifa guardada antes de este contrato no trae `shipmentId`.
    expect(toShippingSelection({ id: 'rate_ground', rate: 8.5 })).toBeNull()
    expect(toShippingSelection({ rate: 8.5 })).toBeNull()
    expect(toShippingSelection(null)).toBeNull()
  })
})

describe('createCheckout', () => {
  it('sends the shipping selection without an amount', async () => {
    let sent: unknown
    server.use(
      http.post('/api/checkout/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true, url: 'https://pay', orderId: 'o', orderNumber: 'O1', tax: 0 })
      }),
    )

    await createCheckout({
      items: [{ id: 'p1', qty: 1 }],
      shipping: { shipmentId: 'shp_1', rateId: 'rate_ground' },
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

    expect(sent).toMatchObject({ shipping: { shipmentId: 'shp_1', rateId: 'rate_ground' } })
    expect((sent as { shipping: Record<string, unknown> }).shipping).not.toHaveProperty('rate')
  })
})
