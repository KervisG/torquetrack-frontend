import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { orderRow, ordersBackend } from '@/test/admin-orders-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

function staffWith(permissions: string[]) {
  return authenticatedSession({
    ...sessionUser,
    role: { slug: 'sales', name: 'Sales', fullAccess: false },
    permissions,
  })
}

describe('OrderDetailPage', () => {
  it('shows customer, shipping, items, totals and payments', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    expect(await screen.findByRole('heading', { name: 'Order O10001' })).toBeInTheDocument()
    expect(screen.getByText('Fleet LLC')).toBeInTheDocument()
    expect(screen.getByText('100 Main St, Tampa FL 33601')).toBeInTheDocument()
    expect(screen.getByText('UPS · Ground')).toBeInTheDocument()
    expect(screen.getByText('1999 Chevrolet K2500 · VIN 1GCHK23')).toBeInTheDocument()

    const items = within(screen.getByRole('table', { name: 'Items' }))
    expect(items.getByText('Injection Pump')).toBeInTheDocument()
    expect(items.getByText('2')).toBeInTheDocument()
    expect(items.getByText('$189.99')).toBeInTheDocument()

    const totals = within(screen.getByLabelText('Totals'))
    expect(totals.getByText('$27.10')).toBeInTheDocument()
    expect(totals.getAllByText('$475.58')).toHaveLength(1)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Payment' }))
    const payments = within(screen.getByRole('table', { name: 'Payments' }))
    expect(payments.getByText('PENDING')).toBeInTheDocument()
    expect(payments.getByText('$475.58')).toBeInTheDocument()
  })

  it('creates a payment link and says it was not emailed', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Payment' }))
    await user.click(screen.getByRole('button', { name: 'Create payment link' }))

    expect(await screen.findByLabelText('Payment link')).toHaveValue(
      'https://checkout.stripe.com/pay/cs_link',
    )
    expect(
      screen.getByText('The link was not emailed. Share it with the customer.'),
    ).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/api/admin/orders/OID1/payment-link/',
    })
  })

  it('starts a secure payment and links to it', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Payment' }))
    await user.click(screen.getByRole('button', { name: 'Take payment' }))

    expect(
      await screen.findByRole('link', { name: 'Open secure payment page' }),
    ).toHaveAttribute('href', 'https://checkout.stripe.com/pay/cs_take')
  })

  it('shows the payment provider error', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/orders/:id/take-payment/', () =>
        HttpResponse.json({ error: 'Stripe is not configured' }, { status: 502 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/orders/OID1')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Payment' }))
    await user.click(screen.getByRole('button', { name: 'Take payment' }))

    expect(await screen.findByText('Stripe is not configured')).toBeInTheDocument()
  })

  it('hides payment actions for a paid order', async () => {
    const backend = ordersBackend([orderRow({ paymentStatus: 'PAID' })])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    expect(await screen.findByRole('heading', { name: 'Order O10001' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Payment' }))
    expect(screen.queryByRole('button', { name: 'Take payment' })).not.toBeInTheDocument()
    expect(screen.getByText('This order is paid.')).toBeInTheDocument()
  })

  it('hides payment actions without payments.take', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(staffWith(['orders.view']), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    expect(await screen.findByRole('heading', { name: 'Order O10001' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Payment' }))
    expect(screen.queryByRole('button', { name: 'Take payment' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Status' }))
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument()
  })

  it('updates the order status', async () => {
    const backend = ordersBackend([orderRow({ status: 'OPEN' })])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Status' }))
    await user.selectOptions(screen.getByLabelText('Order status'), 'PROCESSING')
    await user.click(screen.getByRole('button', { name: 'Update status' }))

    expect(await screen.findByText('Status updated.')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'PATCH',
      path: '/api/admin/orders/OID1/',
      body: { status: 'PROCESSING' },
    })
  })

  it('offers cancel only with orders.cancel', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(staffWith(['orders.view', 'orders.status']), ...backend.handlers)
    renderApp('/admin/orders/OID1')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Status' }))
    const select = screen.getByLabelText('Order status')
    expect(within(select).queryByRole('option', { name: 'CANCELLED' })).not.toBeInTheDocument()
    expect(within(select).queryByRole('option', { name: 'COMPLETED' })).not.toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'REJECTED' })).toBeInTheDocument()
  })

  it('says so when the order does not exist', async () => {
    const backend = ordersBackend([orderRow({})])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/orders/OID_MISSING')

    expect(await screen.findByText('Order not found.')).toBeInTheDocument()
  })
})
