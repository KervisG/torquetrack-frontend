import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { useCartStore } from '@/stores/cart-store'
import { accountOk } from '@/test/account-handlers'
import { authenticatedSession, customerUser } from '@/test/admin-handlers'
import { productsOk, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('CheckoutPage', () => {
  afterEach(() => useCartStore.setState({ items: [] }))

  it('shows an empty cart until products are added', async () => {
    server.use(productsOk())
    renderApp('/checkout')

    expect(await screen.findByRole('heading', { name: 'Cart & Secure Checkout' })).toBeInTheDocument()
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('leaves the customer fields empty and editable for a guest', async () => {
    server.use(productsOk())
    renderApp('/checkout')

    const email = await screen.findByLabelText('Email')
    expect(email).toHaveValue('')
    expect(email).not.toHaveAttribute('readonly')
    expect(screen.getByLabelText('Full name')).toHaveValue('')
  })

  it('ships free and calculates tax once the address is complete', async () => {
    const user = userEvent.setup()
    useCartStore.setState({ items: [{ id: sampleProduct.id, qty: 1 }] })
    let taxedShipping: unknown
    server.use(
      productsOk(),
      http.post('/api/tax/estimate/', async ({ request }) => {
        taxedShipping = ((await request.json()) as { shipping: unknown }).shipping
        return HttpResponse.json({ tax: 0, source: 'No sales tax' })
      }),
    )
    renderApp('/checkout')

    await user.type(await screen.findByLabelText('Full name'), 'Pat Fleet')
    await user.type(screen.getByLabelText('Street address'), '100 Main St')
    await user.type(screen.getByLabelText('City'), 'Tampa')
    await user.selectOptions(screen.getByLabelText('State'), 'FL')
    await user.type(screen.getByLabelText('ZIP'), '33601')

    expect(await screen.findByText('No sales tax')).toBeInTheDocument()
    expect(taxedShipping).toBe(0)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('prefills the signed-in customer and locks the account email', async () => {
    server.use(productsOk(), authenticatedSession(customerUser), accountOk())
    renderApp('/checkout')

    expect(await screen.findByDisplayValue('Pat Fleet')).toBeInTheDocument()
    const email = screen.getByLabelText('Email')
    expect(email).toHaveValue('pat@example.com')
    expect(email).toHaveAttribute('readonly')
    // El perfil guarda `555-0100` (7 dígitos): no se precarga un teléfono inválido.
    expect(screen.getByLabelText('Phone')).toHaveValue('')
    expect(screen.getByLabelText('Street address')).toHaveValue('100 Main St')
    expect(screen.getByLabelText('City')).toHaveValue('Tampa')
    expect(screen.getByLabelText('State')).toHaveValue('FL')
    expect(screen.getByLabelText('ZIP')).toHaveValue('33601')
  })
})
