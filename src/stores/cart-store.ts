import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiRequest } from '@/lib/api-client'
import type { ShippingRate } from '@/features/storefront/catalog/types'

export type CartLine = { id: string; qty: number }

// El backend es la fuente de verdad: devuelve cada línea repreciada. El store
// solo guarda `id` y `qty`; el precio de venta sale del catálogo. `previousPrice`
// es la referencia de cuando el producto entró, y solo llega si cambió.
type ServerLine = CartLine & { priceChanged?: boolean; previousPrice?: number }
type ServerCart = { items: ServerLine[]; notices?: string[] }

// Mismo tope que `MAX_STOREFRONT_QUANTITY` del backend: más de 99 por línea
// el backend lo rechaza con 400, así que el carrito nunca lo deja pasar.
export const MAX_CART_QUANTITY = 99

// Agrupa los clics seguidos en un solo `PUT`.
const PUSH_DELAY_MS = 250

function clampQty(qty: number): number {
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.trunc(qty) || 1))
}

// Sin id de carrito: el backend lo resuelve por la cuenta o por la sesión de
// Django y no acepta uno del cliente.
type CartState = {
  items: CartLine[]
  // Avisos del último carrito leído. No se persisten: los repone el backend.
  notices: string[]
  priceChanges: Record<string, number>
  shipping: ShippingRate | null
  drawerOpen: boolean
  add: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  setShipping: (rate: ShippingRate | null) => void
  setDrawerOpen: (open: boolean) => void
}

// `revision` cuenta los cambios locales y `syncedRevision` el último que el
// servidor confirmó. Una respuesta que llega después de un cambio local más
// nuevo no lo pisa: la reconciliación la hace el `PUT` de ese cambio.
let revision = 0
let syncedRevision = 0
let pushTimer: ReturnType<typeof setTimeout> | undefined
// `undefined` hasta conocer la sesión; `null` es un invitado.
let cartOwner: string | null | undefined

function schedulePush(): void {
  revision += 1
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void pushCart()
  }, PUSH_DELAY_MS)
}

function sameItems(a: CartLine[], b: CartLine[]): boolean {
  return a.length === b.length && a.every((item, index) => item.id === b[index].id && item.qty === b[index].qty)
}

function priceChangesFrom(cart: ServerCart): Record<string, number> {
  const changes: Record<string, number> = {}
  for (const line of cart.items) {
    if (line.priceChanged && typeof line.previousPrice === 'number') changes[line.id] = line.previousPrice
  }
  return changes
}

function applyServerCart(cart: ServerCart): void {
  const items = cart.items.map((line) => ({ id: line.id, qty: clampQty(line.qty) }))
  const notices = cart.notices ?? []
  const priceChanges = priceChangesFrom(cart)
  const current = useCartStore.getState()
  const sameLines = sameItems(current.items, items)
  if (sameLines && sameNotices(current.notices, notices) && sameChanges(current.priceChanges, priceChanges)) {
    return
  }
  // La tarifa se cotizó para los ítems anteriores. Un aviso de precio no la invalida.
  useCartStore.setState({
    notices,
    priceChanges,
    ...(sameLines ? {} : { items, shipping: null }),
  })
}

function sameNotices(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((notice, index) => notice === b[index])
}

function sameChanges(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notices: [],
      priceChanges: {},
      shipping: null,
      drawerOpen: false,
      // La tarifa elegida se cotizó para estos ítems exactos y el backend la
      // rechaza si el carrito cambia, así que todo cambio la descarta.
      add: (id) => {
        const items = get().items.map((item) => ({ ...item }))
        const found = items.find((item) => item.id === id)
        // En el tope no cambia nada: la tarifa cotizada sigue valiendo.
        if (found && found.qty >= MAX_CART_QUANTITY) return
        if (found) found.qty = clampQty(found.qty + 1)
        else items.push({ id, qty: 1 })
        set({ items, shipping: null })
        schedulePush()
      },
      setQty: (id, qty) => {
        const next = clampQty(qty)
        const current = get().items.find((item) => item.id === id)
        if (!current || current.qty === next) return
        set({
          items: get().items.map((item) => (item.id === id ? { ...item, qty: next } : item)),
          shipping: null,
        })
        schedulePush()
      },
      remove: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
          shipping: null,
        })
        schedulePush()
      },
      clear: () => {
        set({ items: [], shipping: null })
        schedulePush()
      },
      setShipping: (rate) => set({ shipping: rate }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      // Solo caché para pintar antes de la primera respuesta del backend.
      name: 'tt-cart',
      partialize: (state) => ({
        items: state.items,
        shipping: state.shipping,
      }),
      // Un carrito guardado antes del tope puede traer más de 99.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CartState>
        return {
          ...current,
          ...saved,
          items: (saved.items ?? current.items).map((item) => ({
            ...item,
            qty: clampQty(item.qty),
          })),
        }
      },
    },
  ),
)

// Envía el carrito completo (`PUT` reemplaza): el último cambio gana y un
// reintento no duplica nada.
export async function pushCart(): Promise<void> {
  clearTimeout(pushTimer)
  pushTimer = undefined
  const sent = revision
  const items = useCartStore.getState().items.map(({ id, qty }) => ({ id, qty }))
  try {
    const cart = await apiRequest<ServerCart>('/cart', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
    if (sent !== revision) return
    syncedRevision = sent
    applyServerCart(cart)
  } catch {
    // Rechazado (un producto que dejó de venderse) o sin red: se vuelve a lo
    // que tiene el servidor. Sin red la lectura también falla y queda la caché.
    if (sent !== revision) return
    syncedRevision = sent
    await hydrateCart()
  }
}

// Lee el carrito del backend y lo aplica si no hay cambios locales sin
// confirmar.
export async function hydrateCart(): Promise<void> {
  const started = revision
  if (started !== syncedRevision) return
  try {
    const cart = await apiRequest<ServerCart>('/cart')
    if (revision === started) applyServerCart(cart)
  } catch {
    // Sin respuesta se conserva la caché local.
  }
}

// Llamar cada vez que se conoce el usuario de la sesión. Al cambiar de cuenta
// (login, logout) un envío pendiente era del dueño anterior y se descarta: tras
// el login el backend ya fusionó el carrito invitado con el de la cuenta.
export function syncCartOwner(userId: string | null): Promise<void> {
  const changed = cartOwner !== undefined && cartOwner !== userId
  cartOwner = userId
  if (changed) {
    clearTimeout(pushTimer)
    pushTimer = undefined
    revision += 1
    syncedRevision = revision
  }
  return hydrateCart()
}
