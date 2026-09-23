import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { quoteRow, quotesBackend } from '@/test/admin-quotes-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const building = quoteRow({
  id: 'QID2',
  number: 'Q10002',
  status: 'BUILDING',
  createdAt: '2026-09-05T15:00:00Z',
  customer: { name: 'Lee Guest', email: 'lee@example.com' },
  totals: { total: 99 },
})

function staffWith(permissions: string[]) {
  return authenticatedSession({
    ...sessionUser,
    role: { slug: 'sales', name: 'Sales', fullAccess: false },
    permissions,
  })
}

describe('QuotesPage', () => {
  it('blocks staff without quotes.view and never calls the API', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(staffWith(['dashboard.view']), ...backend.handlers)
    renderApp('/admin/quotes')

    expect(
      await screen.findByText('You do not have permission to view quotes.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Quotes' })).not.toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })

  it('lists quotes newest first', async () => {
    const backend = quotesBackend([quoteRow({}), building])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes')

    expect(await screen.findByRole('heading', { name: 'Quotes' })).toBeInTheDocument()
    await screen.findByRole('link', { name: 'Q10001' })
    const links = screen.getAllByRole('link', { name: /^Q1000/ })
    expect(links.map((link) => link.textContent)).toEqual(['Q10002', 'Q10001'])
    const row = within(screen.getByRole('link', { name: 'Q10001' }).closest('tr') as HTMLElement)
    expect(row.getByText('Pat Fleet')).toBeInTheDocument()
    expect(row.getByText('$634.00')).toBeInTheDocument()
    expect(row.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('starts filtered by the status in the URL', async () => {
    const backend = quotesBackend([quoteRow({}), building])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/quotes?status=BUILDING')

    expect(await screen.findByRole('link', { name: 'Q10002' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Q10001' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('BUILDING')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Status'), 'ALL')
    expect(screen.getByRole('link', { name: 'Q10001' })).toBeInTheDocument()
  })

  it('offers New quote only with quotes.create', async () => {
    const backend = quotesBackend([quoteRow({})])
    server.use(staffWith(['quotes.view']), ...backend.handlers)
    renderApp('/admin/quotes')

    await screen.findByRole('link', { name: 'Q10001' })
    expect(screen.queryByRole('link', { name: 'New quote' })).not.toBeInTheDocument()
  })

  it('shows the API error when the list fails', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/quotes/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    )
    renderApp('/admin/quotes')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })
})
