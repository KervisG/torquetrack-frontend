import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { productsOk, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('ProductPage', () => {
  it('renders the product returned by the catalog', async () => {
    server.use(productsOk())
    renderApp(`/product/${sampleProduct.id}`)

    expect(await screen.findByRole('heading', { name: sampleProduct.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })

  it('shows not found when the id is missing from the catalog', async () => {
    server.use(productsOk())
    renderApp('/product/missing-id')

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
  })

  it('shows the API error when products fail to load', async () => {
    server.use(
      http.get('/api/products/', () =>
        HttpResponse.json({ error: 'Unable to load products.' }, { status: 502 }),
      ),
    )
    renderApp(`/product/${sampleProduct.id}`)

    expect(await screen.findByText('Unable to load products.')).toBeInTheDocument()
  })
})
