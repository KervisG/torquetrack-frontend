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
  afterEach(() => useCartStore.setState({ items: [], shipping: null }))

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

  it('asks for new shipping rates when the cart changes', async () => {
    const user = userEvent.setup()
    useCartStore.setState({ items: [{ id: sampleProduct.id, qty: 1 }], shipping: null })
    let quotedItems: unknown
    server.use(
      productsOk(),
      http.post('/api/shipping/rates/', async ({ request }) => {
        quotedItems = ((await request.json()) as { items: unknown }).items
        return HttpResponse.json({
          configured: true,
          ground: { id: 'rate_ground', shipmentId: 'shp_1', carrier: 'USPS', service: 'Ground', rate: 8.5 },
          secondDay: null,
          overnight: null,
        })
      }),
    )
    renderApp('/checkout')

    await user.type(await screen.findByLabelText('Full name'), 'Pat Fleet')
    await user.type(screen.getByLabelText('Street address'), '100 Main St')
    await user.type(screen.getByLabelText('City'), 'Tampa')
    await user.selectOptions(screen.getByLabelText('State'), 'FL')
    await user.type(screen.getByLabelText('ZIP'), '33601')
    await user.click(screen.getByRole('button', { name: 'Get Shipping Rates' }))
    await user.click(await screen.findByRole('button', { name: 'Use this rate' }))

    expect(quotedItems).toEqual([{ id: sampleProduct.id, qty: 1 }])
    expect(useCartStore.getState().shipping?.id).toBe('rate_ground')

    await user.click(screen.getByRole('button', { name: '+' }))

    // La tarifa y las opciones eran de una unidad; con dos hay que cotizar de nuevo.
    expect(useCartStore.getState().shipping).toBeNull()
    expect(screen.queryByRole('button', { name: 'Use this rate' })).not.toBeInTheDocument()
  })

  it('prefills the signed-in customer and locks the account email', async () => {
    server.use(productsOk(), authenticatedSession(customerUser), accountOk())
    renderApp('/checkout')

    expect(await screen.findByDisplayValue('Pat Fleet')).toBeInTheDocument()
    const email = screen.getByLabelText('Email')
    expect(email).toHaveValue('pat@example.com')
    expect(email).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Phone')).toHaveValue('555-0100')
    expect(screen.getByLabelText('Street address')).toHaveValue('100 Main St')
    expect(screen.getByLabelText('City')).toHaveValue('Tampa')
    expect(screen.getByLabelText('State')).toHaveValue('FL')
    expect(screen.getByLabelText('ZIP')).toHaveValue('33601')
  })
})
