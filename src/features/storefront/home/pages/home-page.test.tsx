import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Storefront home', () => {
  it('renders the shop catalog on /', async () => {
    server.use(productsOk())
    renderApp('/')

    expect(await screen.findByRole('heading', { name: /find it/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
  })
})
