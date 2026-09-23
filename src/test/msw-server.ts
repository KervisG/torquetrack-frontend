import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Sin sesión por defecto: `api-client` pide `/api/session/` antes del primer
// request que muta para obtener el token CSRF.
export const server = setupServer(
  http.get('/api/session/', () =>
    HttpResponse.json({ error: 'Unauthorized', csrfToken: 'csrf-test-token' }, { status: 401 }),
  ),
  http.post('/api/cart/sync/', () =>
    HttpResponse.json({ ok: true, cartId: 'cart_test', status: 'CART' }),
  ),
)
