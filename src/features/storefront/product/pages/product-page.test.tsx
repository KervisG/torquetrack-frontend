import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { productDetailOk, productsOk, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('ProductPage', () => {
  it('renders the product returned by the catalog', async () => {
    server.use(productsOk(), productDetailOk())
    renderApp(`/product/${sampleProduct.slug}`)

    expect(await screen.findByRole('heading', { name: sampleProduct.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
    expect(screen.getByText('Chevrolet / GMC')).toBeInTheDocument()
    expect(screen.getAllByText('502-550').length).toBeGreaterThan(0)
    expect(screen.getByText('High-pressure fuel pump')).toBeInTheDocument()
    expect(screen.getByText('12561204')).toBeInTheDocument()
  })

  it('offers a quote when the product has no price', async () => {
    server.use(productsOk(), productDetailOk({ ...sampleProduct, price: 0 }))
    renderApp(`/product/${sampleProduct.id}`)

    expect(await screen.findByText('Price on request')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a quote' })).toHaveAttribute('href', '/quote')
  })

  it('shows not found when the id is missing from the catalog', async () => {
    server.use(productsOk(), productDetailOk())
    renderApp('/product/missing-id')

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
  })

  it('shows the API error when products fail to load', async () => {
    server.use(
      productsOk(),
      http.get('/api/products/:idOrSlug/', () =>
        HttpResponse.json({ error: 'Unable to load products.' }, { status: 502 }),
      ),
    )
    renderApp(`/product/${sampleProduct.id}`)

    expect(await screen.findByText('Unable to load products.')).toBeInTheDocument()
  })
})
