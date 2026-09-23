import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'

import { syncCart, useCartStore } from './cart-store'

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

// El carrito es de la sesión de Django: el cliente nunca elige qué carrito
// escribe, así que el body no lleva id.
describe('syncCart', () => {
  it('does not send a cart id', async () => {
    let sent: Record<string, unknown> = {}
    server.use(
      http.post('/api/cart/sync/', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ok: true, status: 'ACTIVE' })
      }),
    )
    useCartStore.setState({ items: [{ id: sampleProduct.id, qty: 1 }] })

    await syncCart([sampleProduct])

    expect(sent).not.toHaveProperty('cartId')
    expect(sent.items).toEqual([expect.objectContaining({ productId: sampleProduct.id, quantity: 1 })])
  })
})
