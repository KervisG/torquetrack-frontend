import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { dashboardOk, sessionUser, unauthorizedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('RegisterPage', () => {
  it('creates an account, signs in, and opens the dashboard', async () => {
    let authenticated = false
    server.use(
      http.get('/api/admin/session/', () => {
        if (!authenticated) {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({ authenticated: true, user: sessionUser })
      }),
      http.post('/api/register/', () =>
        HttpResponse.json({
          ok: true,
          user: { ...sessionUser, roleSlug: 'employee', active: true },
        }),
      ),
      http.post('/api/admin/login/', () => {
        authenticated = true
        return HttpResponse.json({
          ok: true,
          user: {
            id: sessionUser.id,
            email: sessionUser.email,
            username: sessionUser.username,
            role: sessionUser.role,
          },
        })
      }),
      dashboardOk(),
    )

    const user = userEvent.setup()
    renderApp('/admin/register')

    await user.type(await screen.findByLabelText('First name'), 'Ada')
    await user.type(screen.getByLabelText('Last name'), 'Diesel')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows the API error when the email already exists', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/register/', () =>
        HttpResponse.json({ error: 'Email already exists' }, { status: 409 }),
      ),
    )

    const user = userEvent.setup()
    renderApp('/admin/register')

    await user.type(await screen.findByLabelText('First name'), 'Ada')
    await user.type(screen.getByLabelText('Last name'), 'Diesel')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
  })
})
