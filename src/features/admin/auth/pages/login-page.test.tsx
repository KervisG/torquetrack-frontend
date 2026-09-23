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
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('LoginPage', () => {
  it('signs in and opens the dashboard', async () => {
    let authenticated = false
    server.use(
      http.get('/api/session/', () => {
        if (!authenticated) {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({ authenticated: true, user: sessionUser })
      }),
      http.post('/api/login/', async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string }
        if (body.email === 'ada@example.com' && body.password === 'secret') {
          authenticated = true
          return HttpResponse.json({ authenticated: true, user: sessionUser })
        }
        return HttpResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
      }),
      dashboardOk(),
    )

    const user = userEvent.setup()
    renderApp('/admin/login')

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Ada Diesel')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('shows the API error when credentials are wrong', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/login/', () =>
        HttpResponse.json({ error: 'Incorrect email or password' }, { status: 401 }),
      ),
    )

    const user = userEvent.setup()
    renderApp('/admin/login')

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('sends an already signed-in employee to the dashboard', async () => {
    server.use(authenticatedSession(), dashboardOk())
    renderApp('/admin/login')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('keeps a signed-in customer without role out of the admin area', async () => {
    server.use(authenticatedSession(customerUser), productsOk())
    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: /no vin/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('lets a signed-in customer see the login form to switch accounts', async () => {
    server.use(authenticatedSession(customerUser))
    renderApp('/admin/login')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('does not offer public self-registration', async () => {
    server.use(unauthorizedSession())
    renderApp('/admin/login')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /create account/i })).not.toBeInTheDocument()
  })
})
