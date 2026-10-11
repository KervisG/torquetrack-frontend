import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { productsApi, sampleProduct } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

// El servidor filtra y pagina: después de cada cambio la lista llega en otra
// respuesta, así que las aserciones esperan el resultado nuevo.
describe('CatalogPage', () => {
  it('lists products before a truck is chosen, then filters by brand', async () => {
    server.use(
      productsApi([
        sampleProduct,
        {
          ...sampleProduct,
          id: 'ford-turbo',
          title: 'Ford Power Stroke Turbo',
          make: 'Ford',
          manufacturer: 'Garrett',
        },
      ]),
    )
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByText(sampleProduct.title)).toBeInTheDocument()
    expect(screen.getByText('Ford Power Stroke Turbo')).toBeInTheDocument()
    expect(screen.getByText('2 results')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Brand' }), 'Garrett')

    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.queryByText(sampleProduct.title)).not.toBeInTheDocument()
    expect(screen.getByText('Ford Power Stroke Turbo')).toBeInTheDocument()
  })

  it('adds a new product category to the filter', async () => {
    server.use(
      productsApi([
        sampleProduct,
        {
          ...sampleProduct,
          id: 'glow-plug',
          title: 'Duramax Glow Plug',
          category: 'Glow Plug',
        },
      ]),
    )
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByText(sampleProduct.title)).toBeInTheDocument()
    const category = screen.getByRole('combobox', { name: 'Category' })
    expect(category).toHaveTextContent('High-pressure fuel pump')
    expect(category).toHaveTextContent('Glow Plug')

    await user.selectOptions(category, 'Glow Plug')

    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.queryByText(sampleProduct.title)).not.toBeInTheDocument()
    expect(screen.getByText('Duramax Glow Plug')).toBeInTheDocument()
  })

  it('filters used products by condition', async () => {
    server.use(
      productsApi([
        { ...sampleProduct, id: 'new-pump', title: 'New Pump', condition: 'New' },
        { ...sampleProduct, id: 'used-turbo', title: 'Used Turbo', condition: 'Used' },
      ]),
    )
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByText('New Pump')).toBeInTheDocument()
    expect(screen.getByText('Used Turbo')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Condition' }), 'Used')

    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.queryByText('New Pump')).not.toBeInTheDocument()
    expect(screen.getByText('Used Turbo')).toBeInTheDocument()
  })

  it('filters by the price slider', async () => {
    server.use(
      productsApi([
        { ...sampleProduct, id: 'cheap', title: 'Cheap Seal', price: 0 },
        { ...sampleProduct, id: 'mid', title: 'Mid Pump', price: 1 },
        { ...sampleProduct, id: 'premium', title: 'Premium Turbo', price: 2 },
      ]),
    )
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByText('Cheap Seal')).toBeInTheDocument()
    screen.getByRole('slider', { name: 'Minimum price' }).focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.queryByText('Cheap Seal')).not.toBeInTheDocument())
    expect(screen.getByText('Mid Pump')).toBeInTheDocument()
    expect(screen.getByText('Premium Turbo')).toBeInTheDocument()

    screen.getByRole('slider', { name: 'Maximum price' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.getByText('Mid Pump')).toBeInTheDocument()
    expect(screen.queryByText('Premium Turbo')).not.toBeInTheDocument()
  })

  it('hides a zero price and the cart button until the product page', async () => {
    server.use(
      productsApi([
        {
          ...sampleProduct,
          price: 0,
          image: 'https://placehold.co/640x480/111827/ffffff?text=Pump',
        },
      ]),
    )
    renderApp('/')

    expect(await screen.findByText('Price on request')).toBeInTheDocument()
    expect(screen.getByText('Part # 502-550')).toBeInTheDocument()
    expect(screen.getAllByText('502-550').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument()
  })

  it('keeps later results on the next page', async () => {
    const many = Array.from({ length: 17 }, (_, index) => ({
      ...sampleProduct,
      id: `part-${index}`,
      title: `Part ${index}`,
    }))
    server.use(productsApi(many))
    const user = userEvent.setup()
    renderApp('/')

    expect(await screen.findByText('Part 0')).toBeInTheDocument()
    expect(screen.getByText('1–16 of 17 results')).toBeInTheDocument()
    expect(screen.queryByText('Part 16')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Part 16')).toBeInTheDocument()
    expect(screen.queryByText('Part 0')).not.toBeInTheDocument()
    expect(screen.getByText('17–17 of 17 results')).toBeInTheDocument()
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
