import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { customerRow, customersBackend } from '@/test/admin-customers-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const pending = customerRow({ taxStatus: 'PENDING VERIFICATION' })

function staffWith(permissions: string[]) {
  return authenticatedSession({
    ...sessionUser,
    role: { slug: 'sales', name: 'Sales', fullAccess: false },
    permissions,
  })
}

describe('CustomerDetailPage', () => {
  it('shows the profile and the submitted tax exemption', async () => {
    const backend = customersBackend([pending])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers/C_PAT')

    expect(await screen.findByRole('heading', { name: 'Pat Fleet' })).toBeInTheDocument()
    const profile = within(screen.getByRole('region', { name: 'Profile' }))
    expect(profile.getByText('pat@example.com')).toBeInTheDocument()
    expect(profile.getByText('555-0100')).toBeInTheDocument()
    expect(profile.getByText('Has account')).toBeInTheDocument()

    const review = within(await screen.findByRole('region', { name: 'Tax exemption' }))
    expect(await review.findByText('12-3456789')).toBeInTheDocument()
    expect(review.getByText('Resale')).toBeInTheDocument()
    expect(review.getByRole('link', { name: 'Download resale.pdf' })).toHaveAttribute(
      'download',
      'resale.pdf',
    )
    expect(review.getByRole('button', { name: 'Open certificate' })).toBeInTheDocument()
  })

  it('verifies the exemption and shows the reviewer', async () => {
    const backend = customersBackend([pending])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers/C_PAT')

    const user = userEvent.setup()
    const review = within(await screen.findByRole('region', { name: 'Tax exemption' }))
    await review.findByText('12-3456789')
    await user.selectOptions(review.getByLabelText('New tax status'), 'VERIFIED')
    await user.click(review.getByRole('button', { name: 'Update tax status' }))

    expect(await review.findByText('ada@example.com')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/api/admin/customers/C_PAT/tax-status/',
      body: { status: 'VERIFIED' },
    })
    expect(
      await within(screen.getByRole('region', { name: 'Profile' })).findByText('VERIFIED'),
    ).toBeInTheDocument()
  })

  it('shows the error when the tax status update fails', async () => {
    const backend = customersBackend([pending])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/customers/:id/tax-status/', () =>
        HttpResponse.json({ error: 'Invalid tax status' }, { status: 400 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/customers/C_PAT')

    const user = userEvent.setup()
    const review = within(await screen.findByRole('region', { name: 'Tax exemption' }))
    await review.findByText('12-3456789')
    await user.click(review.getByRole('button', { name: 'Update tax status' }))

    expect(await review.findByText('Invalid tax status')).toBeInTheDocument()
  })

  it('hides the review panel without tax_exemptions.review and never asks for it', async () => {
    const backend = customersBackend([pending])
    server.use(staffWith(['customers.view']), ...backend.handlers)
    renderApp('/admin/customers/C_PAT')

    expect(await screen.findByRole('heading', { name: 'Pat Fleet' })).toBeInTheDocument()
    expect(
      screen.getByText('You do not have permission to review tax exemptions.'),
    ).toBeInTheDocument()
    expect(backend.calls.map((call) => call.path)).toEqual(['/api/admin/customers/'])
  })

  it('says so when the customer does not exist', async () => {
    const backend = customersBackend([pending])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/customers/C_MISSING')

    expect(await screen.findByText('Customer not found.')).toBeInTheDocument()
  })

  it('blocks staff without customers.view', async () => {
    const backend = customersBackend([pending])
    server.use(staffWith(['tax_exemptions.review']), ...backend.handlers)
    renderApp('/admin/customers/C_PAT')

    expect(
      await screen.findByText('You do not have permission to view customers.'),
    ).toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })
})
