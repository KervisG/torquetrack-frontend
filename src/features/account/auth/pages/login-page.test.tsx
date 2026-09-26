import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  authenticatedSession,
  customerUser,
  dashboardOk,
  sessionUser,
  unauthorizedSession,
} from '@/test/admin-handlers'
import { accountOk } from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

import type { SessionUser } from '../types'

// La sesión arranca vacía y pasa a `user` en cuanto el login responde 200.
function loginFlow(user: SessionUser) {
  let authenticated = false
  return [
    http.get('/api/session/', () => {
      if (!authenticated) {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return HttpResponse.json({ authenticated: true, user, csrfToken: 'rotated' })
    }),
    http.post('/api/login/', async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string }
      if (body.email === user.email && body.password === 'secret') {
        authenticated = true
        return HttpResponse.json({ authenticated: true, user, csrfToken: 'rotated' })
      }
      return HttpResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }),
  ]
}

async function signIn(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it('sends staff to the admin dashboard', async () => {
    server.use(...loginFlow(sessionUser), dashboardOk())
    renderApp('/login')

    await signIn('ada@example.com', 'secret')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Ada Diesel')).toBeInTheDocument()
  })

  it('sends a customer to the account portal', async () => {
    server.use(...loginFlow(customerUser), accountOk(), productsOk())
    renderApp('/login')

    await signIn('pat@example.com', 'secret')

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('shows the API error when credentials are wrong', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/login/', () =>
        HttpResponse.json({ error: 'Incorrect email or password' }, { status: 401 }),
      ),
    )
    renderApp('/login')

    await signIn('ada@example.com', 'wrong')

    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('validates the form before calling the API', async () => {
    server.use(unauthorizedSession())
    renderApp('/login')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Valid email required')).toBeInTheDocument()
    expect(screen.getByText('Password required')).toBeInTheDocument()
  })

  it('links to registration', async () => {
    server.use(unauthorizedSession())
    renderApp('/login')

    expect(await screen.findByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    )
  })

  it('skips the form for a signed-in staff member', async () => {
    server.use(authenticatedSession(), dashboardOk())
    renderApp('/login')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('skips the form for a signed-in customer', async () => {
    server.use(authenticatedSession(customerUser), accountOk(), productsOk())
    renderApp('/login')

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('redirects the legacy admin login to the shared login', async () => {
    server.use(unauthorizedSession())
    renderApp('/admin/login')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
