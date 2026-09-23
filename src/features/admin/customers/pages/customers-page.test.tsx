import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { customerRow, customersBackend } from '@/test/admin-customers-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const pat = customerRow({})
const invited = customerRow({
  id: 'C_INV',
  email: 'lee@example.com',
  name: 'Lee Guest',
  company: '',
  portalStatus: 'NOT ACTIVATED',
  taxStatus: 'PENDING VERIFICATION',
})

function rowFor(email: string) {
  return screen.getByText(email).closest('tr') as HTMLElement
}

function staffWith(permissions: string[]) {
  return authenticatedSession({
    ...sessionUser,
    role: { slug: 'sales', name: 'Sales', fullAccess: false },
    permissions,
  })
}

describe('CustomersPage', () => {
  it('blocks staff without customers.view and never calls the API', async () => {
    const backend = customersBackend([pat])
    server.use(staffWith(['dashboard.view']), ...backend.handlers)
    renderApp('/admin/customers')

    expect(
      await screen.findByText('You do not have permission to view customers.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Customers' })).not.toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })

  it('lists customers with tax and portal status', async () => {
    const backend = customersBackend([pat, invited])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument()
    await screen.findByText('pat@example.com')
    const row = within(rowFor('pat@example.com'))
    expect(row.getByRole('link', { name: 'Pat Fleet' })).toHaveAttribute(
      'href',
      '/admin/customers/C_PAT',
    )
    expect(row.getByText('Fleet LLC')).toBeInTheDocument()
    expect(row.getByText('VERIFIED')).toBeInTheDocument()
    expect(row.getByText('Has account')).toBeInTheDocument()
    expect(within(rowFor('lee@example.com')).getByText('No account')).toBeInTheDocument()
  })

  it('filters by search text and tax status', async () => {
    const backend = customersBackend([pat, invited])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    const user = userEvent.setup()
    await screen.findByText('pat@example.com')
    await user.type(screen.getByLabelText('Search customers'), 'fleet')
    expect(screen.queryByText('lee@example.com')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search customers'))
    await user.selectOptions(screen.getByLabelText('Tax status'), 'PENDING VERIFICATION')
    expect(screen.getByText('lee@example.com')).toBeInTheDocument()
    expect(screen.queryByText('pat@example.com')).not.toBeInTheDocument()
  })

  it('creates a customer', async () => {
    const backend = customersBackend([])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create customer' }))
    await user.type(form.getByLabelText('Name'), 'Nia New')
    await user.type(form.getByLabelText('Company (optional)'), 'New Fleet')
    await user.type(form.getByLabelText('Email'), 'nia@example.com')
    await user.click(form.getByRole('button', { name: 'Create customer' }))

    expect(await screen.findByText('nia@example.com')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/api/admin/customers/',
      body: expect.objectContaining({
        name: 'Nia New',
        company: 'New Fleet',
        email: 'nia@example.com',
      }),
    })
  })

  it('validates the new customer before calling the API', async () => {
    const backend = customersBackend([])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create customer' }))
    await user.type(form.getByLabelText('Email'), 'not-an-email')
    await user.click(form.getByRole('button', { name: 'Create customer' }))

    expect(await form.findByText('Name is required')).toBeInTheDocument()
    expect(form.getByText('Valid email required')).toBeInTheDocument()
    expect(backend.calls.filter((call) => call.method === 'POST')).toEqual([])
  })

  it('shows the 409 when the email belongs to another customer', async () => {
    const backend = customersBackend([])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/customers/', () =>
        HttpResponse.json(
          { error: 'That email already belongs to another customer.' },
          { status: 409 },
        ),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/customers')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create customer' }))
    await user.type(form.getByLabelText('Name'), 'Pat Fleet')
    await user.click(form.getByRole('button', { name: 'Create customer' }))

    expect(
      await form.findByText('That email already belongs to another customer.'),
    ).toBeInTheDocument()
  })

  it('hides create, invite and delete without the edit and delete permissions', async () => {
    const backend = customersBackend([invited])
    server.use(staffWith(['customers.view']), ...backend.handlers)
    renderApp('/admin/customers')

    await screen.findByText('lee@example.com')
    expect(screen.queryByRole('form', { name: 'Create customer' })).not.toBeInTheDocument()
    const row = within(rowFor('lee@example.com'))
    expect(row.queryByRole('button', { name: 'Send portal invite' })).not.toBeInTheDocument()
    expect(row.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('sends a portal invite and shows the activation link', async () => {
    const backend = customersBackend([pat, invited])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    const user = userEvent.setup()
    await screen.findByText('lee@example.com')
    // Quien ya tiene cuenta no recibe invitación.
    expect(
      within(rowFor('pat@example.com')).queryByRole('button', { name: 'Send portal invite' }),
    ).not.toBeInTheDocument()
    await user.click(
      within(rowFor('lee@example.com')).getByRole('button', { name: 'Send portal invite' }),
    )

    expect(await screen.findByLabelText('Activation link for lee@example.com')).toHaveValue(
      'http://localhost:5174/activate?token=abc123',
    )
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/api/admin/customers/portal-invite/',
      body: { customerId: 'C_INV' },
    })
  })

  it('shows the invite error', async () => {
    const backend = customersBackend([invited])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/customers/portal-invite/', () =>
        HttpResponse.json({ error: 'Customer already has an account' }, { status: 409 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/customers')

    const user = userEvent.setup()
    await screen.findByText('lee@example.com')
    await user.click(
      within(rowFor('lee@example.com')).getByRole('button', { name: 'Send portal invite' }),
    )

    expect(await screen.findByText('Customer already has an account')).toBeInTheDocument()
  })

  it('deletes a customer only after confirmation', async () => {
    const backend = customersBackend([pat, invited])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers')

    const user = userEvent.setup()
    await screen.findByText('lee@example.com')
    await user.click(within(rowFor('lee@example.com')).getByRole('button', { name: 'Delete' }))
    expect(backend.calls.filter((call) => call.method === 'DELETE')).toEqual([])
    await user.click(
      within(rowFor('lee@example.com')).getByRole('button', { name: 'Confirm delete' }),
    )

    await expect.poll(() => screen.queryByText('lee@example.com')).toBeNull()
    expect(backend.calls).toContainEqual({
      method: 'DELETE',
      path: '/api/admin/customers/C_INV/',
    })
  })

  it('shows the API error when the list fails', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/customers/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    )
    renderApp('/admin/customers')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })
})
