import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { useCartStore } from '@/stores/cart-store'

type CartLine = { id: string; qty: number }

function cartBody(items: CartLine[]) {
  return {
    items: items.map(({ id, qty }) => ({
      id,
      qty,
      title: id,
      partNumber: '',
      price: null,
      coreCharge: null,
      lineTotal: null,
    })),
    subtotal: 0,
    core: 0,
  }
}

// Sin sesión por defecto: `api-client` pide `/api/session/` antes del primer
// request que muta para obtener el token CSRF. El carrito del backend por
// defecto coincide con el del store, así un test que arma el store no lo ve
// pisado por la hidratación; un test que pruebe la reconciliación lo reemplaza.
export const server = setupServer(
  http.get('/api/session/', () =>
    HttpResponse.json({ error: 'Unauthorized', csrfToken: 'csrf-test-token' }, { status: 401 }),
  ),
  http.get('/api/cart/', () => HttpResponse.json(cartBody(useCartStore.getState().items))),
  http.put('/api/cart/', async ({ request }) => {
    const body = (await request.json()) as { items: CartLine[] }
    return HttpResponse.json(cartBody(body.items))
  }),
)
