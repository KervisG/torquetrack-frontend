import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { customerUser, unauthorizedSession } from '@/test/admin-handlers'
import { accountOk } from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

async function fillForm(overrides: { confirm?: string } = {}) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Full name'), 'Pat Fleet')
  await user.type(screen.getByLabelText('Company (optional)'), 'Fleet LLC')
  await user.type(screen.getByLabelText('Phone (optional)'), '555-0100')
  await user.type(screen.getByLabelText('Email'), 'pat@example.com')
  await user.type(screen.getByLabelText('Password'), 'diesel-pass-123')
  await user.type(screen.getByLabelText('Confirm password'), overrides.confirm ?? 'diesel-pass-123')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  it('creates the account and opens the portal', async () => {
    let authenticated = false
    let sent: Record<string, string> | undefined
    server.use(
      http.get('/api/session/', () =>
        authenticated
          ? HttpResponse.json({ authenticated: true, user: customerUser, csrfToken: 't' })
          : HttpResponse.json({ error: 'Unauthorized', csrfToken: 't' }, { status: 401 }),
      ),
      http.post('/api/register/', async ({ request }) => {
        sent = (await request.json()) as Record<string, string>
        authenticated = true
        return HttpResponse.json(
          { authenticated: true, user: customerUser, csrfToken: 't2' },
          { status: 201 },
        )
      }),
      accountOk(),
      productsOk(),
    )
    renderApp('/register')

    await fillForm()

    expect(await screen.findByRole('heading', { name: 'My account' })).toBeInTheDocument()
    expect(sent).toEqual({
      name: 'Pat Fleet',
      company: 'Fleet LLC',
      phone: '555-0100',
      email: 'pat@example.com',
      password: 'diesel-pass-123',
    })
  })

  it('shows the 409 error when the email already has an account', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/register/', () =>
        HttpResponse.json({ error: 'Email already exists' }, { status: 409 }),
      ),
    )
    renderApp('/register')

    await fillForm()

    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
  })

  it('shows the 400 error from the password validators', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/register/', () =>
        HttpResponse.json({ error: 'This password is too common.' }, { status: 400 }),
      ),
    )
    renderApp('/register')

    await fillForm()

    expect(await screen.findByText('This password is too common.')).toBeInTheDocument()
  })

  it('rejects mismatched passwords without calling the API', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/register/', () => {
        throw new Error('register must not be called')
      }),
    )
    renderApp('/register')

    await fillForm({ confirm: 'something-else' })

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })
})
