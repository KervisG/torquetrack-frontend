import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

function entry(id: number, action: string) {
  return {
    id,
    actorId: 'ada@example.com',
    action,
    entityType: 'QUOTE',
    entityId: 'QID1',
    data: { quoteNumber: 'Q10001' },
    createdAt: '2026-09-10T12:00:00Z',
  }
}

describe('ActivityPage', () => {
  it('lists recent activity', async () => {
    server.use(
      authenticatedSession(),
      http.get('/api/admin/activity/', () =>
        HttpResponse.json({ items: [entry(1, 'QUOTE_CONVERTED')], nextCursor: null }),
      ),
    )
    renderApp('/admin/activity')

    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeInTheDocument()
    const row = within((await screen.findByText('QUOTE_CONVERTED')).closest('tr') as HTMLElement)
    expect(row.getByText('ada@example.com')).toBeInTheDocument()
    expect(row.getByText('QUOTE · QID1')).toBeInTheDocument()
  })

  it('loads the next page with the cursor until there is none', async () => {
    const cursors: (string | null)[] = []
    server.use(
      authenticatedSession(),
      http.get('/api/admin/activity/', ({ request }) => {
        const before = new URL(request.url).searchParams.get('before')
        cursors.push(before)
        return HttpResponse.json(
          before === '2'
            ? { items: [entry(1, 'USER_CREATED')], nextCursor: null }
            : { items: [entry(3, 'QUOTE_SENT'), entry(2, 'QUOTE_DELETED')], nextCursor: 2 },
        )
      }),
    )
    renderApp('/admin/activity')

    expect(await screen.findByText('QUOTE_DELETED')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('USER_CREATED')).toBeInTheDocument()
    expect(screen.getByText('QUOTE_SENT')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    expect(cursors).toEqual([null, '2'])
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
        return HttpResponse.json({ items: [], nextCursor: null })
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
