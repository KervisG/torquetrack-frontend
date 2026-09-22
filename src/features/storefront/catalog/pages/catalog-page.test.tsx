import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { productsOk, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('CatalogPage', () => {
  it('asks for a brand before listing products, then shows the catalog', async () => {
    server.use(productsOk())
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByRole('heading', { name: /no vin/i })).toBeInTheDocument()
    expect(
      screen.getByText('Select a brand to browse compatible parts.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Chevrolet' }))
    expect(await screen.findByText(sampleProduct.title)).toBeInTheDocument()
    expect(screen.getByText('1 products')).toBeInTheDocument()
  })

  it('shows the API error when the catalog fails', async () => {
    server.use(
      http.get('/api/products/', () =>
        HttpResponse.json({ error: 'Catalog unavailable' }, { status: 502 }),
      ),
    )
    renderApp('/')

    expect(await screen.findByText('Catalog unavailable')).toBeInTheDocument()
  })
})
