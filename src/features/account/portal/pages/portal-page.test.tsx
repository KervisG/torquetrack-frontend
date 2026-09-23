import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  authenticatedSession,
  customerUser,
  sessionUser,
  unauthorizedSession,
} from '@/test/admin-handlers'
import {
  accountOk,
  accountOrdersOk,
  accountQuotesOk,
  sampleProfile,
} from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

function signedInCustomer() {
  return [authenticatedSession(customerUser), productsOk()]
}

describe('PortalPage', () => {
  it('sends an anonymous visitor to sign in', async () => {
    server.use(unauthorizedSession())
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows the profile of the signed-in customer', async () => {
    server.use(...signedInCustomer(), accountOk())
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'My account' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Full name')).toHaveValue('Pat Fleet')
    expect(screen.getByText('pat@example.com')).toBeInTheDocument()
  })

  it('saves only the whitelisted profile fields', async () => {
    let sent: Record<string, unknown> | undefined
    server.use(
      ...signedInCustomer(),
      accountOk(),
      http.patch('/api/account/', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ customer: { ...sampleProfile, ...sent } })
      }),
    )
    renderApp('/account')

    const user = userEvent.setup()
    const city = await screen.findByLabelText('City')
    await user.clear(city)
    await user.type(city, 'Orlando')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
    expect(sent).toEqual({
      name: 'Pat Fleet',
      company: 'Fleet LLC',
      phone: '555-0100',
      address1: '100 Main St',
      address2: '',
      city: 'Orlando',
      state: 'FL',
      zip: '33601',
      country: 'US',
    })
  })

  it('shows the API error when saving fails', async () => {
    server.use(
      ...signedInCustomer(),
      accountOk(),
      http.patch('/api/account/', () =>
        HttpResponse.json({ error: 'phone must be a string' }, { status: 400 }),
      ),
    )
    renderApp('/account')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('phone must be a string')).toBeInTheDocument()
  })

  it('lists orders with the totals returned by the API', async () => {
    server.use(...signedInCustomer(), accountOk(), accountOrdersOk())
    renderApp('/account')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('tab', { name: 'Orders' }))

    const row = (await screen.findByText('O10001')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('$227.89')).toBeInTheDocument()
    expect(within(row as HTMLElement).getByText('Sep 1, 2026')).toBeInTheDocument()
  })

  it('shows an empty order history', async () => {
    server.use(
      ...signedInCustomer(),
      accountOk(),
      http.get('/api/account/orders/', () => HttpResponse.json([])),
    )
    renderApp('/account?tab=orders')

    expect(await screen.findByText('No orders yet.')).toBeInTheDocument()
  })

  it('lists quotes', async () => {
    server.use(...signedInCustomer(), accountOk(), accountQuotesOk())
    renderApp('/account?tab=quotes')

    expect(await screen.findByText('Q10001')).toBeInTheDocument()
    expect(screen.getByText('$579.00')).toBeInTheDocument()
  })

  it('explains that a staff account has no customer profile', async () => {
    server.use(
      authenticatedSession(sessionUser),
      productsOk(),
      http.get('/api/account/', () =>
        HttpResponse.json({ error: 'Customer profile not found' }, { status: 404 }),
      ),
    )
    renderApp('/account')

    expect(
      await screen.findByText('This account does not have a customer profile.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the admin panel' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('does not show the verification banner for a verified email', async () => {
    server.use(...signedInCustomer(), accountOk())
    renderApp('/account')

    expect(await screen.findByLabelText('Full name')).toBeInTheDocument()
    expect(screen.queryByText('Verify your email')).not.toBeInTheDocument()
  })

  it('asks an unverified customer to verify and resends the email', async () => {
    let resent = 0
    server.use(
      authenticatedSession({ ...customerUser, emailVerified: false }),
      productsOk(),
      accountOk(),
      http.post('/api/verify-email/resend/', () => {
        resent += 1
        return HttpResponse.json({ ok: true, emailVerified: false })
      }),
    )
    renderApp('/account')

    expect(await screen.findByText('Verify your email')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Resend email' }))

    expect(await screen.findByText('We sent a new verification link to pat@example.com.')).toBeInTheDocument()
    expect(resent).toBe(1)
  })

  it('shows the API error when resending fails', async () => {
    server.use(
      authenticatedSession({ ...customerUser, emailVerified: false }),
      productsOk(),
      accountOk(),
      http.post('/api/verify-email/resend/', () =>
        HttpResponse.json({ error: 'Request was throttled.' }, { status: 429 }),
      ),
    )
    renderApp('/account')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Resend email' }))

    expect(await screen.findByText('Request was throttled.')).toBeInTheDocument()
  })
})
