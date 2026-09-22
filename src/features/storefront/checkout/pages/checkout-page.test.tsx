import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
})
