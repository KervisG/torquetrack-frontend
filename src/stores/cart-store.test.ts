import { beforeEach, describe, expect, it } from 'vitest'

import { useCartStore } from './cart-store'

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
