import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, dashboardOk, sessionUser } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('DashboardPage', () => {
  it('renders the counts returned by the API', async () => {
    server.use(authenticatedSession(), dashboardOk())
    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('shows the API error when the dashboard fails', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/dashboard/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    )
    renderApp('/admin')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })

  it('hides counts when the role cannot view the dashboard', async () => {
    server.use(
      http.get('/api/admin/session/', () =>
        HttpResponse.json({
          authenticated: true,
          user: { ...sessionUser, permissions: ['products.view'] },
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
      http.get('/api/admin/session/', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ),
    )
    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })
})
