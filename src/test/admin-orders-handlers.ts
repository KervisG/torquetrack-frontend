import { http, HttpResponse } from 'msw'

// Forma de `GET /api/admin/orders/`: el `data` del pedido expandido más las
// columnas y los pagos (sin el id de Stripe).
export type OrderApiRow = {
  id: string
  number: string
  status: string
  paymentStatus: string
  createdAt: string
  customer: Record<string, string> | null
  items: Array<Record<string, unknown>>
  totals: { subtotal?: number; core?: number; shipping?: number; tax?: number; total?: number }
  shipping?: unknown
  vehicle?: Record<string, string>
  quoteNumber?: string
  payments: Array<{
    id: string
    provider: string
    status: string
    amount: number
    source: string
    createdAt: string
  }>
}

export function orderRow(overrides: Partial<OrderApiRow>): OrderApiRow {
  return {
    id: 'OID1',
    number: 'O10001',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'UNPAID',
    createdAt: '2026-09-01T15:00:00Z',
    customer: {
      id: 'C_PAT',
      name: 'Pat Fleet',
      company: 'Fleet LLC',
      email: 'pat@example.com',
      phone: '555-0100',
      address1: '100 Main St',
      city: 'Tampa',
      state: 'FL',
      zip: '33601',
    },
    items: [
      {
        id: 'gm-65-injection-pump',
        title: 'Injection Pump',
        partNumber: '502-550',
        qty: 2,
        price: 189.99,
        coreCharge: 25,
      },
    ],
    totals: { subtotal: 379.98, core: 50, shipping: 18.5, tax: 27.1, total: 475.58 },
    shipping: { carrier: 'UPS', service: 'Ground', rate: 18.5 },
    vehicle: { vin: '1GCHK23', year: '1999', make: 'Chevrolet', model: 'K2500' },
    payments: [
      {
        id: 'PAY1',
        provider: 'stripe',
        status: 'PENDING',
        amount: 475.58,
        source: '',
        createdAt: '2026-09-01T15:01:00Z',
      },
    ],
    ...overrides,
  }
}

type Call = { method: string; path: string; body?: unknown }

export function ordersBackend(initial: OrderApiRow[]) {
  const orders = [...initial]
  const calls: Call[] = []
  const handlers = [
    http.get('/api/admin/orders/', () => {
      calls.push({ method: 'GET', path: '/api/admin/orders/' })
      return HttpResponse.json(orders)
    }),
    http.patch('/api/admin/orders/:id/', async ({ params, request }) => {
      const body = (await request.json()) as { status: string }
      calls.push({ method: 'PATCH', path: `/api/admin/orders/${params.id}/`, body })
      const index = orders.findIndex((order) => order.id === params.id)
      orders[index] = { ...orders[index], status: body.status }
      return HttpResponse.json({ ok: true, status: body.status })
    }),
    http.post('/api/admin/orders/:id/payment-link/', ({ params }) => {
      calls.push({ method: 'POST', path: `/api/admin/orders/${params.id}/payment-link/` })
      return HttpResponse.json({
        ok: true,
        url: 'https://checkout.stripe.com/pay/cs_link',
        emailed: false,
      })
    }),
    http.post('/api/admin/orders/:id/take-payment/', ({ params }) => {
      calls.push({ method: 'POST', path: `/api/admin/orders/${params.id}/take-payment/` })
      return HttpResponse.json({ ok: true, url: 'https://checkout.stripe.com/pay/cs_take' })
    }),
  ]
  return { handlers, calls }
}
