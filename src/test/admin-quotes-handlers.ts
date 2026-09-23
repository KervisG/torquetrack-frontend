import { http, HttpResponse } from 'msw'

// Forma de `GET /api/admin/quotes/`: `serialize_quote` del backend.
export type QuoteApiRow = {
  id: string
  number: string
  status: string
  createdAt: string
  expiresAt: string | null
  customerId?: string | null
  customer: Record<string, string> | null
  vehicle?: Record<string, string>
  items: Array<Record<string, unknown>>
  totals: { subtotal?: number; core?: number; shipping?: number; tax?: number; total?: number }
  memo?: string
  createdBy?: string
  orderNumber?: string
  publicToken?: string
  lastEmailedAt?: string
  lastEmailedTo?: string
}

export function quoteRow(overrides: Partial<QuoteApiRow>): QuoteApiRow {
  return {
    id: 'QID1',
    number: 'Q10001',
    status: 'ACTIVE',
    createdAt: '2026-09-02T15:00:00Z',
    expiresAt: '2026-10-02T15:00:00Z',
    customerId: 'C_PAT',
    customer: { name: 'Pat Fleet', company: 'Fleet LLC', email: 'pat@example.com', phone: '555-0100' },
    vehicle: { year: '2004', make: 'Dodge', model: 'Ram 2500', engine: '5.9', vin: '3D7KU28C' },
    items: [
      {
        productId: 'cummins-hx35',
        title: 'HX35 Turbocharger',
        partNumber: 'HX35-590',
        quantity: 1,
        unitPrice: 429,
        coreCharge: 150,
      },
    ],
    totals: { subtotal: 429, core: 150, shipping: 25, tax: 30, total: 634 },
    memo: 'Call before shipping',
    createdBy: 'ada@example.com',
    ...overrides,
  }
}

type Call = { method: string; path: string; body?: unknown }

export function quotesBackend(initial: QuoteApiRow[]) {
  const quotes = [...initial]
  const calls: Call[] = []
  const find = (id: unknown) => quotes.findIndex((quote) => quote.id === id)
  const handlers = [
    http.get('/api/admin/quotes/', () => {
      calls.push({ method: 'GET', path: '/api/admin/quotes/' })
      return HttpResponse.json(quotes)
    }),
    http.post('/api/admin/quotes/', async ({ request }) => {
      const body = (await request.json()) as QuoteApiRow & { shipping?: number; tax?: number }
      calls.push({ method: 'POST', path: '/api/admin/quotes/', body })
      const index = find(body.id)
      const saved = quoteRow({
        ...(index >= 0 ? quotes[index] : {}),
        ...body,
        id: body.id || 'QID_NEW',
        number: index >= 0 ? quotes[index].number : 'Q10099',
        totals: { subtotal: 1, core: 0, shipping: body.shipping, tax: body.tax, total: 777 },
      })
      if (index >= 0) quotes[index] = saved
      else quotes.push(saved)
      return HttpResponse.json({ updated: index >= 0, quote: saved })
    }),
    http.delete('/api/admin/quotes/:id/', ({ params }) => {
      calls.push({ method: 'DELETE', path: `/api/admin/quotes/${params.id}/` })
      quotes.splice(find(params.id), 1)
      return HttpResponse.json({ ok: true, archived: false })
    }),
    http.post('/api/admin/quotes/:id/:action/', ({ params }) => {
      const action = String(params.action)
      calls.push({ method: 'POST', path: `/api/admin/quotes/${params.id}/${action}/` })
      const index = find(params.id)
      if (action === 'preview' || action === 'send') {
        return HttpResponse.json({ ok: true, url: 'http://localhost:5174/quote/tok123' })
      }
      if (action === 'reopen') {
        quotes[index] = { ...quotes[index], status: 'ACTIVE' }
        return HttpResponse.json({ ok: true })
      }
      quotes[index] = { ...quotes[index], status: 'CONVERTED', orderNumber: 'O20001' }
      return HttpResponse.json({ ok: true, order: { id: 'OID_NEW', number: 'O20001' } })
    }),
  ]
  return { handlers, calls }
}
