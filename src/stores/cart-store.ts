import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiRequest } from '@/lib/api-client'
import type { Product, ShippingRate } from '@/features/storefront/catalog/types'

export type CartLine = { id: string; qty: number }

type CartState = {
  cartId: string
  items: CartLine[]
  shipping: ShippingRate | null
  drawerOpen: boolean
  add: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  setShipping: (rate: ShippingRate | null) => void
  setDrawerOpen: (open: boolean) => void
}

function newCartId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: newCartId(),
      items: [],
      shipping: null,
      drawerOpen: false,
      // La tarifa elegida se cotizó para estos ítems exactos y el backend la
      // rechaza si el carrito cambia, así que todo cambio la descarta.
      add: (id) => {
        const items = get().items.map((item) => ({ ...item }))
        const found = items.find((item) => item.id === id)
        if (found) found.qty += 1
        else items.push({ id, qty: 1 })
        set({ items, shipping: null })
      },
      setQty: (id, qty) => {
        const next = Math.max(1, qty)
        const current = get().items.find((item) => item.id === id)
        if (!current || current.qty === next) return
        set({
          items: get().items.map((item) => (item.id === id ? { ...item, qty: next } : item)),
          shipping: null,
        })
      },
      remove: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
          shipping: null,
        })
      },
      clear: () => set({ items: [], shipping: null }),
      setShipping: (rate) => set({ shipping: rate }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: 'tt-cart',
      partialize: (state) => ({
        cartId: state.cartId,
        items: state.items,
        shipping: state.shipping,
      }),
    },
  ),
)

export function cartRows(products: Product[]): Array<Product & { qty: number }> {
  const items = useCartStore.getState().items
  return items
    .map((item) => {
      const product = products.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is Product & { qty: number } => Boolean(row?.id))
}

export async function syncCart(
  products: Product[],
  stage = 'CART',
  customer: Record<string, string> = {},
): Promise<void> {
  const { cartId, items } = useCartStore.getState()
  const rows = cartRows(products).filter((row) =>
    items.some((item) => item.id === row.id),
  )
  await apiRequest('/cart/sync', {
    method: 'POST',
    body: JSON.stringify({
      cartId,
      stage,
      customer,
      items: rows.map((row) => ({
        productId: row.id,
        title: row.title,
        partNumber: row.partNumber || row.aftermarketPart || row.oemPart || '',
        quantity: row.qty,
        unitPrice: Number(row.price || 0),
        coreCharge: Number(row.coreCharge || 0),
      })),
    }),
  })
}
