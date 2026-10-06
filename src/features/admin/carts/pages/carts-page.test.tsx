import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const cart = {
  id: 'da923dc0-12db-4909-8e6c-6cfedfd2cc85',
  status: 'ABANDONED',
  stage: 'CART',
  updatedAt: '2026-09-27T21:57:00Z',
  email: 'kervisramon@gmail.com',
  items: [
    { id: 'inj', title: 'Reman Fuel Injector', partNumber: 'HP-60', qty: 1, priceAtAdd: 420.5 },
    { id: 'filter', title: 'Fuel Filter', partNumber: 'FF-1', qty: 2, priceAtAdd: 18 },
  ],
}

function cartsBackend() {
  return http.get('/api/admin/carts/', () => HttpResponse.json([cart]))
}

// `findByRole` sobre toda la app (barra lateral + contenido) tarda cientos de ms
// por intento y con la suite en paralelo agota el timeout; se espera con queries
// baratas (texto o etiqueta acotados por selector) y los roles se consultan después.
describe('CartsPage', () => {
  it('lists the customer and opens the cart from the row', async () => {
    server.use(authenticatedSession(), cartsBackend())
    renderApp('/admin/carts')

    const link = await screen.findByText('kervisramon@gmail.com', { selector: 'a' })
    expect(link).toHaveAttribute('href', '/admin/carts/da923dc0-12db-4909-8e6c-6cfedfd2cc85')
    const row = within(link.closest('tr') as HTMLElement)
    expect(row.getByText('ABANDONED')).toBeInTheDocument()
    expect(row.getByText('2 items')).toBeInTheDocument()
    expect(screen.queryByText(cart.id)).not.toBeInTheDocument()
  })

  it('filters by the status in the URL', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/carts/', () =>
        HttpResponse.json([cart, { ...cart, id: 'other', status: 'ACTIVE', email: 'ada@example.com', items: cart.items }]),
      ),
    )
    renderApp('/admin/carts?status=ACTIVE')

    expect(await screen.findByText('ada@example.com', { selector: 'a' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'kervisramon@gmail.com' })).not.toBeInTheDocument()
  })

  it('blocks staff without carts.view', async () => {
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'parts', name: 'Parts', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
      cartsBackend(),
    )
    renderApp('/admin/carts')

    expect(await screen.findByText('You do not have permission to view carts.')).toBeInTheDocument()
  })
})

describe('CartDetailPage', () => {
  it('shows each item and the price stored when it was added', async () => {
    server.use(authenticatedSession(), cartsBackend())
    renderApp(`/admin/carts/${cart.id}`)

    expect(await screen.findByText('kervisramon@gmail.com', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    const items = screen.getByRole('table', { name: 'Cart items' })
    expect(items).toHaveTextContent('Reman Fuel Injector')
    expect(items).toHaveTextContent('HP-60')
    expect(items).toHaveTextContent('$420.50')
    expect(items).toHaveTextContent('Fuel Filter')
    expect(items).toHaveTextContent('$18.00')
  })

  it('says so when the cart does not exist', async () => {
    server.use(authenticatedSession(), cartsBackend())
    renderApp('/admin/carts/missing')

    expect(await screen.findByText('Cart not found.')).toBeInTheDocument()
  })
})
