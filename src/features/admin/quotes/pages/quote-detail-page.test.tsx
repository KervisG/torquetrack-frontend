import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
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

// `findByRole` sobre toda la app (barra lateral + contenido) tarda cientos de ms
// por intento y con la suite en paralelo agota el timeout; se espera con queries
// baratas (texto o etiqueta acotados por selector) y los roles se consultan después.
describe('QuoteDetailPage', () => {
  it('shows customer, vehicle, items and the totals from the API', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    expect(await screen.findByText('Quote Q10001', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(screen.getByText('Fleet LLC')).toBeInTheDocument()
    expect(screen.getByText('2004 Dodge Ram 2500 5.9 · VIN 3D7KU28C')).toBeInTheDocument()
    expect(screen.getByText('Call before shipping')).toBeInTheDocument()
    const items = within(screen.getByRole('table', { name: 'Items' }))
    expect(items.getByText('HX35 Turbocharger')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Totals')).getByText('$634.00')).toBeInTheDocument()
    // Sin botón de PDF: la generación queda fuera del panel.
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument()
  })

  it('shows the email error when sending fails', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/quotes/:id/send/', () =>
        HttpResponse.json({ error: 'Email provider not configured' }, { status: 502 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    await user.click(await screen.findByText('Send to customer', { selector: 'button' }))

    expect(await screen.findByText('Email provider not configured')).toBeInTheDocument()
  })

  it('sends the quote and confirms it', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    await user.click(await screen.findByText('Send to customer', { selector: 'button' }))

    expect(await screen.findByText('Quote emailed to pat@example.com.')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({ method: 'POST', path: '/api/admin/quotes/QID1/send/' })
  })

  it('gets the public link for the customer', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    await user.click(await screen.findByText('Get public link', { selector: 'button' }))

    expect(await screen.findByLabelText('Public quote link')).toHaveValue(
      'http://localhost:5174/quote/tok123',
    )
    expect(screen.getByRole('link', { name: 'Open public page' })).toHaveAttribute(
      'href',
      'http://localhost:5174/quote/tok123',
    )
  })

  it('converts the quote to an order and links to it', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    await user.click(await screen.findByText('Convert to order', { selector: 'button' }))
    await user.click(await screen.findByText('Confirm convert', { selector: 'button' }))

    expect(await screen.findByText('Open order O20001', { selector: 'a' })).toHaveAttribute(
      'href',
      '/admin/orders/OID_NEW',
    )
  })

  it('reopens an expired quote instead of converting it', async () => {
    const backend = quotesBackend([quoteRow({ status: 'EXPIRED' })])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    expect(await screen.findByText('Quote Q10001', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Convert to order' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reopen for 30 days' }))

    expect(await screen.findByText('Quote reopened for 30 days.')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({ method: 'POST', path: '/api/admin/quotes/QID1/reopen/' })
  })

  it('deletes after confirmation and goes back to the list', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    const user = userEvent.setup()
    await user.click(await screen.findByText('Delete', { selector: 'button' }))
    expect(backend.calls.filter((call) => call.method === 'DELETE')).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByText('Quotes', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(backend.calls).toContainEqual({ method: 'DELETE', path: '/api/admin/quotes/QID1/' })
  })

  it('shows only the actions the role allows', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(staffWith(['quotes.view']), ...backend.handlers)
    renderApp('/admin/quotes/QID1')

    expect(await screen.findByText('Quote Q10001', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get public link' })).toBeInTheDocument()
    for (const name of ['Send to customer', 'Convert to order', 'Delete']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: 'Edit quote' })).not.toBeInTheDocument()
  })

  it('says so when the quote does not exist', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes/QID_MISSING')

    expect(await screen.findByText('Quote not found.')).toBeInTheDocument()
  })
})
