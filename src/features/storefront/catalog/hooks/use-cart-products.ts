import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useCartStore } from '@/stores/cart-store'

import { listProductsByIds } from '../api'
import { catalogKeys } from '../query-keys'

// Los productos de las líneas del carrito, para el panel lateral, el checkout
// y el pedido de cotización. Cambiar una cantidad no vuelve a pedirlos: la
// clave son los ids, ordenados.
export function useCartProducts() {
  const items = useCartStore((state) => state.items)
  const ids = useMemo(() => [...new Set(items.map((item) => item.id))].sort(), [items])
  return useQuery({
    queryKey: catalogKeys.byIds(ids),
    queryFn: () => listProductsByIds(ids),
    // Al sumar un producto se siguen viendo los que ya estaban.
    placeholderData: keepPreviousData,
  })
}
