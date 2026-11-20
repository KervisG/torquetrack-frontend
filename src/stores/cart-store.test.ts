import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'

import { pushCart, useCartStore } from './cart-store'

// El carrito es de la cuenta o de la sesión de Django: el cliente nunca elige
// qué carrito escribe ni manda precios, así que el body lleva solo id y qty.
describe('pushCart', () => {
  it('sends only the product ids and quantities, without a cart id', async () => {
    let sent: Record<string, unknown> = {}
    server.use(
      http.put('/api/cart/', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ items: [{ id: sampleProduct.id, qty: 1 }], subtotal: 0, core: 0 })
      }),
    )
    useCartStore.setState({ items: [{ id: sampleProduct.id, qty: 1 }] })

    await pushCart()

    expect(sent).toEqual({ items: [{ id: sampleProduct.id, qty: 1 }] })
  })

  it('keeps the server price-change notice and the previous price', async () => {
    const notice = 'The price of Pump has changed from $100.00 to $120.00.'
    server.use(
      http.put('/api/cart/', () =>
        HttpResponse.json({
          items: [{ id: sampleProduct.id, qty: 1, priceChanged: true, previousPrice: 100 }],
          notices: [notice],
          subtotal: 120,
          core: 0,
        }),
      ),
    )
    useCartStore.setState({
      items: [{ id: sampleProduct.id, qty: 1 }],
      notices: [],
      priceChanges: {},
    })

    await pushCart()

    expect(useCartStore.getState().notices).toEqual([notice])
    expect(useCartStore.getState().priceChanges).toEqual({ [sampleProduct.id]: 100 })
  })
})
