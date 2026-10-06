import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const products = [
  {
    id: 'turbo',
    title: '6.0L Turbo',
    partNumber: '5C3Z',
    category: 'Turbo',
    make: 'Ford',
    yearFrom: 2005,
    yearTo: 2007,
    price: 2268.99,
    active: true,
  },
  {
    id: 'pump',
    title: 'Oil Pump',
    partNumber: '9A543',
    price: 1126.99,
    active: false,
  },
]

// `findByRole` sobre toda la app (barra lateral + contenido) tarda cientos de ms
// por intento y con la suite en paralelo agota el timeout; se espera con queries
// baratas (texto o etiqueta acotados por selector) y los roles se consultan después.
describe('ProductsPage', () => {
  it('switches between the list and the cards without losing the product', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/products/', () => HttpResponse.json(products)),
    )
    renderApp('/admin/products')

    expect(await screen.findByLabelText('Products', { selector: 'table' })).toBeInTheDocument()
    expect(screen.getByText('6.0L Turbo')).toBeInTheDocument()
    expect(screen.getByText('2005–2007 Ford')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status for Oil Pump' })).toHaveValue('inactive')
    expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Cards' }))

    expect(screen.queryByRole('table', { name: 'Products' })).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByText('6.0L Turbo')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status for Oil Pump' })).toHaveValue('inactive')
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(await screen.findByText('Edit product', { selector: 'h1, h2, h3' })).toBeInTheDocument()
  })

  it('reactivates an inactive product', async () => {
    let body: unknown
    server.use(
      authenticatedSession(),
      http.get('/api/admin/products/', () => HttpResponse.json(products)),
      http.put('/api/admin/products/pump/', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    renderApp('/admin/products')

    const user = userEvent.setup()
    await user.selectOptions(await screen.findByLabelText('Status for Oil Pump', { selector: 'select' }), 'active')

    expect(body).toEqual({ active: true })
  })
})
