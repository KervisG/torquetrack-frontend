import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { accountOk } from '@/test/account-handlers'
import { authenticatedSession, customerUser } from '@/test/admin-handlers'
import { productsOk, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'
import { useCartStore } from '@/stores/cart-store'

function quoteRequestOk(received: unknown[], email = { staff: false, customer: false }) {
  return http.post('/api/quote/request/', async ({ request }) => {
    received.push(await request.json())
    return HttpResponse.json({ ok: true, quoteId: 'QID9', quoteNumber: 'Q10009', email })
  })
}

describe('RequestQuotePage', () => {
  beforeEach(() => {
    useCartStore.setState({ cartId: 'cart_test', items: [{ id: sampleProduct.id, qty: 2 }] })
  })

  afterEach(() => {
    useCartStore.setState({ items: [], shipping: null })
  })

  it('sends a guest request with the cart items and shows the quote number', async () => {
    const received: unknown[] = []
    server.use(productsOk(), quoteRequestOk(received))
    renderApp('/quote')

    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Request a Quote' })).toBeInTheDocument()
    expect(await screen.findByText(sampleProduct.title)).toBeInTheDocument()
    expect(screen.getByText(/Qty 2/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Name or company'), 'Jane Diesel')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Phone'), '555-0199')
    await user.click(screen.getByRole('button', { name: 'Submit quote request' }))

    expect(await screen.findByRole('heading', { name: 'Quote Q10009 received' })).toBeInTheDocument()
    expect(
      screen.getByText(/A TorqueTrack representative will contact you/),
    ).toBeInTheDocument()
    // Sin correo configurado se avisa que no llegará la confirmación.
    expect(screen.getByText(/We could not email a confirmation/)).toBeInTheDocument()
    expect(received).toEqual([
      {
        customer: { name: 'Jane Diesel', email: 'jane@example.com', phone: '555-0199' },
        items: [{ productId: sampleProduct.id, quantity: 2 }],
        cartId: 'cart_test',
      },
    ])
  })

  it('prefills the signed-in customer and locks the account email', async () => {
    const received: unknown[] = []
    server.use(
      productsOk(),
      authenticatedSession(customerUser),
      accountOk(),
      quoteRequestOk(received, { staff: true, customer: true }),
    )
    renderApp('/quote')

    expect(await screen.findByDisplayValue('Pat Fleet')).toBeInTheDocument()
    const email = screen.getByLabelText('Email')
    expect(email).toHaveValue('pat@example.com')
    expect(email).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Phone')).toHaveValue('555-0100')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Submit quote request' }))

    expect(await screen.findByRole('heading', { name: 'Quote Q10009 received' })).toBeInTheDocument()
    expect(screen.getByText(/confirmation was sent to pat@example.com/)).toBeInTheDocument()
    expect(received[0]).toMatchObject({ customer: { email: 'pat@example.com' } })
  })

  it('requires a name and a valid email before calling the API', async () => {
    const received: unknown[] = []
    server.use(productsOk(), quoteRequestOk(received))
    renderApp('/quote')

    const user = userEvent.setup()
    await screen.findByText(sampleProduct.title)
    await user.type(screen.getByLabelText('Email'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Submit quote request' }))

    expect(await screen.findByText('Name or company is required')).toBeInTheDocument()
    expect(screen.getByText('Valid email required')).toBeInTheDocument()
    expect(received).toEqual([])
  })

  it('shows the API error', async () => {
    server.use(
      productsOk(),
      http.post('/api/quote/request/', () =>
        HttpResponse.json({ error: 'No valid products' }, { status: 400 }),
      ),
    )
    renderApp('/quote')

    const user = userEvent.setup()
    await screen.findByText(sampleProduct.title)
    await user.type(screen.getByLabelText('Name or company'), 'Jane Diesel')
    await user.click(screen.getByRole('button', { name: 'Submit quote request' }))

    expect(await screen.findByText('No valid products')).toBeInTheDocument()
  })

  it('asks for parts when the cart is empty', async () => {
    useCartStore.setState({ items: [] })
    server.use(productsOk())
    renderApp('/quote')

    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit quote request' })).not.toBeInTheDocument()
  })
})
