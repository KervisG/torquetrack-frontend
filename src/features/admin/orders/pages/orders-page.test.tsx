import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { orderRow, ordersBackend } from '@/test/admin-orders-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const paid = orderRow({
  id: 'OID2',
  number: 'O10002',
  status: 'PROCESSING',
  paymentStatus: 'PAID',
  createdAt: '2026-09-03T15:00:00Z',
  customer: { name: 'Lee Guest', email: 'lee@example.com' },
  totals: { total: 99.5 },
})

function rowFor(number: string) {
  return screen.getByRole('link', { name: number }).closest('tr') as HTMLElement
}

describe('OrdersPage', () => {
  it('blocks staff without orders.view and never calls the API', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'parts', name: 'Parts', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
      ...backend.handlers,
    )
    renderApp('/admin/orders')

    expect(
      await screen.findByText('You do not have permission to view orders.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Orders' })).not.toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })

  it('lists orders newest first with the totals from the API', async () => {
    const backend = ordersBackend([orderRow({}), paid])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders')

    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    await screen.findByRole('link', { name: 'O10001' })
    const links = screen.getAllByRole('link', { name: /^O1000/ })
    expect(links.map((link) => link.textContent)).toEqual(['O10002', 'O10001'])
    const row = within(rowFor('O10001'))
    expect(row.getByText('Pat Fleet')).toBeInTheDocument()
    expect(row.getByText('$475.58')).toBeInTheDocument()
    expect(row.getByText('UNPAID')).toBeInTheDocument()
    expect(row.getByText('PENDING_PAYMENT')).toBeInTheDocument()
    expect(rowFor('O10001').querySelector('a')).toHaveAttribute('href', '/admin/orders/OID1')
  })

  it('filters by search text and payment status', async () => {
    const backend = ordersBackend([orderRow({}), paid])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders')

    const user = userEvent.setup()
    await screen.findByRole('link', { name: 'O10001' })
    await user.type(screen.getByLabelText('Search orders'), 'guest')
    expect(screen.queryByRole('link', { name: 'O10001' })).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Search orders'))
    await user.selectOptions(screen.getByLabelText('Payment status'), 'UNPAID')
    expect(screen.getByRole('link', { name: 'O10001' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'O10002' })).not.toBeInTheDocument()
  })

  it('shows the API error when the list fails', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/orders/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    )
    renderApp('/admin/orders')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })
})
