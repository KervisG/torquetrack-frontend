import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const publicQuote = {
  number: 'Q10001',
  status: 'ACTIVE',
  createdAt: '2026-09-02T15:00:00Z',
  expiresAt: '2026-10-02T15:00:00Z',
  customer: { name: 'Jane Diesel', company: 'Diesel Co' },
  vehicle: { year: 2004, make: 'Dodge', model: 'Ram 2500' },
  items: [
    {
      title: 'HX35 Turbocharger',
      partNumber: 'HX35-590',
      quantity: 1,
      unitPrice: 429,
      coreCharge: 150,
      lineTotal: 579,
    },
  ],
  totals: { subtotal: 429, core: 150, shipping: 0, tax: 0, total: 579 },
  payable: true,
}

function detailsOk(body: typeof publicQuote = publicQuote) {
  return http.get('/api/quote/public/:token/details/', () => HttpResponse.json(body))
}

describe('PublicQuotePage', () => {
  it('shows the quote with the line totals from the API', async () => {
    server.use(productsOk(), detailsOk())
    renderApp('/quote/tok123')

    expect(await screen.findByRole('heading', { name: 'Quote Q10001' })).toBeInTheDocument()
    expect(screen.getByText('Prepared for Jane Diesel · Diesel Co')).toBeInTheDocument()
    expect(screen.getByText('2004 Dodge Ram 2500')).toBeInTheDocument()
    expect(screen.getByText(/Valid until Oct 2, 2026/)).toBeInTheDocument()
    const items = within(screen.getByRole('table', { name: 'Quote items' }))
    expect(items.getByText('HX35 Turbocharger')).toBeInTheDocument()
    expect(items.getByText('$579.00')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Totals')).getByText('$579.00')).toBeInTheDocument()
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument()
  })

  it('explains an invalid link', async () => {
    server.use(
      productsOk(),
      http.get('/api/quote/public/:token/details/', () =>
        HttpResponse.json({ error: 'Quote not found' }, { status: 404 }),
      ),
    )
    renderApp('/quote/bad-token')

    expect(
      await screen.findByRole('heading', { name: 'Quote link not found' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument()
  })

  it('explains an expired quote', async () => {
    server.use(
      productsOk(),
      http.get('/api/quote/public/:token/details/', () =>
        HttpResponse.json({ error: 'This quote has expired' }, { status: 410 }),
      ),
    )
    renderApp('/quote/old-token')

    expect(await screen.findByRole('heading', { name: 'This quote has expired' })).toBeInTheDocument()
    expect(screen.getByText(/Contact TorqueTrack to reopen it/)).toBeInTheDocument()
  })

  it('shows the checkout error when payments are not available', async () => {
    let checkoutToken = ''
    server.use(
      productsOk(),
      detailsOk(),
      http.post('/api/quote/public/:token/checkout/', ({ params }) => {
        checkoutToken = String(params.token)
        return HttpResponse.json({ error: 'Stripe is not configured' }, { status: 502 })
      }),
    )
    renderApp('/quote/tok123')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Checkout securely' }))

    expect(await screen.findByText('Stripe is not configured')).toBeInTheDocument()
    expect(checkoutToken).toBe('tok123')
  })

  it.each([
    ['BUILDING', false],
    ['LOST', false],
    ['CONVERTED', false],
  ])('hides checkout when the backend says a %s quote is not payable', async (status, payable) => {
    server.use(productsOk(), detailsOk({ ...publicQuote, status, payable }))
    renderApp('/quote/tok123')

    expect(await screen.findByRole('heading', { name: 'Quote Q10001' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Checkout securely' })).not.toBeInTheDocument()
  })

  it('offers checkout again for a converted quote whose order is still unpaid', async () => {
    // El backend decide con la misma regla que el checkout: una cotización
    // convertida sin pedido pagado se puede reintentar.
    server.use(productsOk(), detailsOk({ ...publicQuote, status: 'CONVERTED', payable: true }))
    renderApp('/quote/tok123')

    expect(await screen.findByRole('button', { name: 'Checkout securely' })).toBeInTheDocument()
  })

  it.each([
    [409, 'This quote has already been paid'],
    [410, 'This quote has expired'],
  ])('shows the backend message when checkout answers %i', async (status, error) => {
    server.use(
      productsOk(),
      detailsOk(),
      http.post('/api/quote/public/:token/checkout/', () =>
        HttpResponse.json({ error }, { status }),
      ),
    )
    renderApp('/quote/tok123')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Checkout securely' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(error)
  })
})
