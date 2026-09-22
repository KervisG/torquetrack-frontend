import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.post('/api/cart/sync/', () =>
    HttpResponse.json({ ok: true, cartId: 'cart_test', status: 'CART' }),
  ),
)
