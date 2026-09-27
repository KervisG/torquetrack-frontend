import { MAX_CART_QUANTITY } from '@/stores/cart-store'

// Aviso de la línea que llegó al tope del carrito; debajo del tope no ocupa
// lugar. Lo comparten el carrito lateral, el checkout y la ficha del producto.
export function CartQuantityLimit({ qty }: { qty: number }) {
  if (qty < MAX_CART_QUANTITY) return null
  return (
    <p role="status" className="mt-1 text-xs text-amber-700">
      Maximum {MAX_CART_QUANTITY} per item. Request a quote for larger quantities.
    </p>
  )
}
