import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  authenticatedSession,
  customerUser,
  dashboardAnalyticsOk,
  dashboardOk,
  sessionUser,
} from '@/test/admin-handlers'
import { accountOk } from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

// `findByRole` sobre toda la app (barra lateral + contenido) tarda cientos de ms
// por intento y con la suite en paralelo agota el timeout; se espera con queries
// baratas (texto o etiqueta acotados por selector) y los roles se consultan después.
describe('DashboardPage', () => {
  it('renders the counts returned by the API', async () => {
    server.use(authenticatedSession(), dashboardOk(), dashboardAnalyticsOk())
    renderApp('/admin')

    expect(await screen.findByText('Dashboard', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('links each count to its screen', async () => {
    server.use(authenticatedSession(), dashboardOk(), dashboardAnalyticsOk())
    renderApp('/admin')

    // `*ByRole` sobre todo el panel (shell + analítica) tarda cientos de ms por
    // intento; con la suite en paralelo `findByRole` agota el timeout. Se espera
    // la lista de conteos con una query barata y los roles se buscan dentro.
    const counts = within(await screen.findByLabelText('Right now'))
    expect(counts.getByRole('link', { name: /^Orders\s*3$/ })).toHaveAttribute(
      'href',
      '/admin/orders',
    )
    expect(counts.getByRole('link', { name: /^Active quotes/ })).toHaveAttribute(
      'href',
      '/admin/quotes?status=ACTIVE',
    )
    expect(counts.getByRole('link', { name: /^Building quotes/ })).toHaveAttribute(
      'href',
      '/admin/quotes?status=BUILDING',
    )
  })

  it('does not link counts the role cannot open', async () => {
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'sales', name: 'Sales', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
      dashboardOk(), dashboardAnalyticsOk(),
    )
    renderApp('/admin')

    const counts = within(await screen.findByLabelText('Right now'))
    expect(counts.getByText('Active quotes')).toBeInTheDocument()
    expect(counts.queryByRole('link', { name: /^Active quotes/ })).not.toBeInTheDocument()
    expect(counts.queryByRole('link', { name: /^Orders/ })).not.toBeInTheDocument()
  })

  it('shows the API error when the dashboard fails', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/dashboard/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
      dashboardAnalyticsOk(),
    )
    renderApp('/admin')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })

  it('hides counts when the role cannot view the dashboard', async () => {
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({
          authenticated: true,
          user: {
            ...sessionUser,
            role: { slug: 'parts', name: 'Parts', fullAccess: false },
            permissions: ['products.view'],
          },
        }),
      ),
    )
    renderApp('/admin')

    expect(
      await screen.findByText('You do not have permission to view the dashboard.'),
    ).toBeInTheDocument()
  })

  it('sends an anonymous visitor to login', async () => {
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ),
    )
    renderApp('/admin')

    expect(await screen.findByText('Sign in', { selector: 'h1, h2, h3' })).toBeInTheDocument()
  })

  it('sends a signed-in customer without role to their account', async () => {
    server.use(authenticatedSession(customerUser), productsOk(), accountOk())
    renderApp('/admin')

    expect(await screen.findByText('Profile', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('hides the Users link without users.manage', async () => {
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'sales', name: 'Sales', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
      dashboardOk(), dashboardAnalyticsOk(),
    )
    renderApp('/admin')

    expect(await screen.findByText('Dashboard', { selector: 'h1, h2, h3' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('signs out to the shared login', async () => {
    let signedIn = true
    server.use(
      http.get('/api/session/', () =>
        signedIn
          ? HttpResponse.json({ authenticated: true, user: sessionUser, csrfToken: 't' })
          : HttpResponse.json({ error: 'Unauthorized', csrfToken: 't' }, { status: 401 }),
      ),
      http.post('/api/logout/', () => {
        signedIn = false
        return HttpResponse.json({ ok: true })
      }),
      dashboardOk(), dashboardAnalyticsOk(),
    )
    renderApp('/admin')

    const user = userEvent.setup()
    await user.click(await screen.findByLabelText('Account menu', { selector: 'button' }))
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('Sign in', { selector: 'h1, h2, h3' })).toBeInTheDocument()
  })
})
