import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'

import { pushCart, useCartStore } from './cart-store'

const RATE = { id: 'rate_ground', shipmentId: 'shp_1', rate: 8.5 }

// El backend solo acepta una tarifa cotizada para los mismos ítems que se
// pagan: cualquier cambio del carrito obliga a volver a cotizar.
describe('cart store shipping', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [{ id: 'p1', qty: 1 }], shipping: RATE })
  })

  it('drops the selected rate when a product is added', () => {
    useCartStore.getState().add('p2')

    expect(useCartStore.getState().shipping).toBeNull()
  })

  it('drops the selected rate when a quantity changes', () => {
    useCartStore.getState().setQty('p1', 2)

    expect(useCartStore.getState().shipping).toBeNull()
  })

  it('keeps the selected rate when the quantity does not change', () => {
    // El botón − en 1 no cambia nada: no hay por qué volver a cotizar.
    useCartStore.getState().setQty('p1', 0)

    expect(useCartStore.getState().items).toEqual([{ id: 'p1', qty: 1 }])
    expect(useCartStore.getState().shipping).toEqual(RATE)
  })

  it('drops the selected rate when a product is removed', () => {
    useCartStore.getState().remove('p1')

    expect(useCartStore.getState().shipping).toBeNull()
  })
})

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
