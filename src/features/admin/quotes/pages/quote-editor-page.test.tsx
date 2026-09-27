import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { customersBackend } from '@/test/admin-customers-handlers'
import { quoteRow, quotesBackend } from '@/test/admin-quotes-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

function staffWith(permissions: string[]) {
  return authenticatedSession({
    ...sessionUser,
    role: { slug: 'sales', name: 'Sales', fullAccess: false },
    permissions,
  })
}

describe('QuoteEditorPage', () => {
  it('blocks staff without quotes.create', async () => {
    const backend = quotesBackend([])
    server.use(staffWith(['quotes.view']), ...backend.handlers)
    renderApp('/admin/quotes/new')

    expect(
      await screen.findByText('You do not have permission to create or edit quotes.'),
    ).toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })

  it('creates a quote with line items and saves the customer first', async () => {
    const quotes = quotesBackend([])
    const customers = customersBackend([])
    server.use(authenticatedSession(), ...quotes.handlers, ...customers.handlers)
    renderApp('/admin/quotes/new')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Quote' }))
    await user.type(form.getByLabelText('Customer name'), 'Nia New')
    await user.type(form.getByLabelText('Customer email'), 'nia@example.com')
    await user.type(form.getByLabelText('VIN'), '1FTSW21P')
    await user.click(form.getByRole('button', { name: 'Add item' }))
    const line = within(form.getByRole('group', { name: 'Item 1' }))
    await user.type(line.getByLabelText('Description'), 'EGR Cooler')
    await user.type(line.getByLabelText('Part #'), 'EGR-60')
    await user.clear(line.getByLabelText('Unit price'))
    await user.type(line.getByLabelText('Unit price'), '350')
    await user.clear(line.getByLabelText('Qty'))
    await user.type(line.getByLabelText('Qty'), '2')
    await user.clear(form.getByLabelText('Shipping'))
    await user.type(form.getByLabelText('Shipping'), '40')
    await user.click(form.getByRole('button', { name: 'Save quote' }))

    // Tras guardar se abre el detalle con los totales que calculó el backend.
    expect(await screen.findByRole('heading', { name: 'Quote Q10099' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Totals')).getByText('$777.00')).toBeInTheDocument()
    expect(customers.calls).toContainEqual({
      method: 'POST',
      path: '/api/admin/customers/',
      body: { id: null, name: 'Nia New', company: '', email: 'nia@example.com', phone: '' },
    })
    const saved = quotes.calls.find((call) => call.method === 'POST')
    expect(saved?.body).toMatchObject({
      id: null,
      status: 'ACTIVE',
      customerId: 'C_NEW0',
      customer: { name: 'Nia New', email: 'nia@example.com' },
      vehicle: { vin: '1FTSW21P' },
      items: [
        { title: 'EGR Cooler', partNumber: 'EGR-60', quantity: 2, unitPrice: 350, coreCharge: 0 },
      ],
      shipping: 40,
    })
    // El impuesto lo recalcula el backend: sin override el editor no lo manda.
    expect(saved?.body).not.toHaveProperty('tax')
    expect(saved?.body).not.toHaveProperty('taxOverride')
  })

  it('keeps the quote customer as a snapshot without customers.edit', async () => {
    const quotes = quotesBackend([])
    server.use(staffWith(['quotes.view', 'quotes.create']), ...quotes.handlers)
    renderApp('/admin/quotes/new')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Quote' }))
    await user.type(form.getByLabelText('Customer name'), 'Walk In')
    await user.click(form.getByRole('button', { name: 'Add item' }))
    await user.type(
      within(form.getByRole('group', { name: 'Item 1' })).getByLabelText('Description'),
      'Glow plug',
    )
    await user.click(form.getByRole('button', { name: 'Save quote' }))

    expect(await screen.findByRole('heading', { name: 'Quote Q10099' })).toBeInTheDocument()
    expect(quotes.calls.find((call) => call.method === 'POST')?.body).toMatchObject({
      customerId: null,
      customer: { name: 'Walk In' },
    })
  })

  it('requires a customer name and at least one item', async () => {
    const quotes = quotesBackend([])
    server.use(authenticatedSession(), ...quotes.handlers)
    renderApp('/admin/quotes/new')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Quote' }))
    await user.click(form.getByRole('button', { name: 'Save quote' }))

    expect(await form.findByText('Customer name is required')).toBeInTheDocument()
    expect(form.getByText('Add at least one item')).toBeInTheDocument()
    expect(quotes.calls.filter((call) => call.method === 'POST')).toEqual([])
  })

  it('edits an existing quote and keeps its customer link', async () => {
    const quotes = quotesBackend([quoteRow({})])
    const customers = customersBackend([])
    server.use(authenticatedSession(), ...quotes.handlers, ...customers.handlers)
    renderApp('/admin/quotes/QID1/edit')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Quote' }))
    expect(form.getByLabelText('Customer name')).toHaveValue('Pat Fleet')
    const line = within(form.getByRole('group', { name: 'Item 1' }))
    expect(line.getByLabelText('Description')).toHaveValue('HX35 Turbocharger')
    await user.selectOptions(form.getByLabelText('Status'), 'CONTACTED')
    await user.clear(form.getByLabelText('Memo'))
    await user.type(form.getByLabelText('Memo'), 'Customer approved')
    await user.click(form.getByRole('button', { name: 'Save quote' }))

    expect(await screen.findByRole('heading', { name: 'Quote Q10001' })).toBeInTheDocument()
    expect(customers.calls).toContainEqual(
      expect.objectContaining({ body: expect.objectContaining({ id: 'C_PAT' }) }),
    )
    expect(quotes.calls.find((call) => call.method === 'POST')?.body).toMatchObject({
      id: 'QID1',
      status: 'CONTACTED',
      memo: 'Customer approved',
      items: [{ productId: 'cummins-hx35', title: 'HX35 Turbocharger', quantity: 1 }],
    })
  })

  it('shows the save error', async () => {
    const quotes = quotesBackend([quoteRow({})])
    server.use(
      staffWith(['quotes.view', 'quotes.create']),
      http.post('/api/admin/quotes/', () =>
        HttpResponse.json({ error: 'Quote not found' }, { status: 404 }),
      ),
      ...quotes.handlers,
    )
    renderApp('/admin/quotes/QID1/edit')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Quote' }))
    await user.click(form.getByRole('button', { name: 'Save quote' }))

    expect(await form.findByText('Quote not found')).toBeInTheDocument()
  })
})
