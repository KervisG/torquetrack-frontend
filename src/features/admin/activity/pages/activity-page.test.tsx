import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('ActivityPage', () => {
  it('lists recent activity', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/activity/', () =>
        HttpResponse.json([
          {
            id: 1,
            actorId: 'ada@example.com',
            action: 'QUOTE_CONVERTED',
            entityType: 'QUOTE',
            entityId: 'QID1',
            data: { quoteNumber: 'Q10001' },
            createdAt: '2026-09-10T12:00:00Z',
          },
        ]),
      ),
    )
    renderApp('/admin/activity')

    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    const row = within((await screen.findByText('QUOTE_CONVERTED')).closest('tr') as HTMLElement)
    expect(row.getByText('ada@example.com')).toBeInTheDocument()
    expect(row.getByText('QUOTE · QID1')).toBeInTheDocument()
  })

  it('blocks staff without activity.view and never calls the API', async () => {
    let called = false
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'sales', name: 'Sales', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
      http.get('/api/admin/activity/', () => {
        called = true
        return HttpResponse.json([])
      }),
    )
    renderApp('/admin/activity')

    expect(
      await screen.findByText('You do not have permission to view activity.'),
    ).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('shows the API error', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/activity/', () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    )
    renderApp('/admin/activity')

    expect(await screen.findByText('Forbidden')).toBeInTheDocument()
  })
})
