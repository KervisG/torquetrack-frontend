import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { unauthorizedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

describe('VerifyEmailPage', () => {
  it('verifies the token and links to the account', async () => {
    let sent: unknown
    server.use(
      unauthorizedSession(),
      http.post('/api/verify-email/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true, linkedOrders: 2, linkedQuotes: 1 })
      }),
    )
    renderApp('/verify-email?token=tok123')

    expect(await screen.findByText('Your email is verified.')).toBeInTheDocument()
    expect(
      screen.getByText('We added 2 past orders and 1 past quote to your account.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to my account' })).toHaveAttribute(
      'href',
      '/account',
    )
    expect(sent).toEqual({ token: 'tok123' })
  })

  it('does not mention past history when nothing was linked', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/verify-email/', () =>
        HttpResponse.json({ ok: true, linkedOrders: 0, linkedQuotes: 0 }),
      ),
    )
    renderApp('/verify-email?token=tok123')

    expect(await screen.findByText('Your email is verified.')).toBeInTheDocument()
    expect(screen.queryByText(/We added/)).not.toBeInTheDocument()
  })

  it('shows the API error for an invalid link', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/verify-email/', () =>
        HttpResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 }),
      ),
    )
    renderApp('/verify-email?token=old')

    expect(await screen.findByText('Invalid or expired verification link')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to my account' })).toHaveAttribute(
      'href',
      '/account',
    )
  })

  it('explains a link without token', async () => {
    server.use(unauthorizedSession())
    renderApp('/verify-email')

    expect(
      await screen.findByText('This verification link is missing its token.'),
    ).toBeInTheDocument()
  })
})
