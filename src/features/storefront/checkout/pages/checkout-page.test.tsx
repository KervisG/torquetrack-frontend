import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { accountOk } from '@/test/account-handlers'
import { authenticatedSession, customerUser } from '@/test/admin-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('CheckoutPage', () => {
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
    expect(screen.getByLabelText('State (FL)')).toHaveValue('FL')
    expect(screen.getByLabelText('ZIP')).toHaveValue('33601')
  })
})
