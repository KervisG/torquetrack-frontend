import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { customerUser, unauthorizedSession } from '@/test/admin-handlers'
import { accountOk } from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

async function choosePassword(password = 'diesel-pass-123', confirm = password) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Activate account' }))
}

describe('ActivatePage', () => {
  it('activates the invitation and opens the portal', async () => {
    let authenticated = false
    let sent: unknown
    server.use(
      http.get('/api/session/', () =>
        authenticated
          ? HttpResponse.json({ authenticated: true, user: customerUser, csrfToken: 't' })
          : HttpResponse.json({ error: 'Unauthorized', csrfToken: 't' }, { status: 401 }),
      ),
      http.post('/api/activate/', async ({ request }) => {
        sent = await request.json()
        authenticated = true
        return HttpResponse.json(
          { authenticated: true, user: customerUser, csrfToken: 't2' },
          { status: 201 },
        )
      }),
      accountOk(),
      productsOk(),
    )
    renderApp('/activate?token=abc123')

    await choosePassword()

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(sent).toEqual({ token: 'abc123', password: 'diesel-pass-123' })
  })

  it('shows the API error for an expired link', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/activate/', () =>
        HttpResponse.json({ error: 'Invalid or expired activation link' }, { status: 400 }),
      ),
    )
    renderApp('/activate?token=old')

    await choosePassword()

    expect(await screen.findByText('Invalid or expired activation link')).toBeInTheDocument()
  })

  it('explains a link without token', async () => {
    server.use(unauthorizedSession())
    renderApp('/activate')

    expect(await screen.findByText('This activation link is missing its token.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activate account' })).not.toBeInTheDocument()
  })

  it('rejects mismatched passwords', async () => {
    server.use(unauthorizedSession())
    renderApp('/activate?token=abc123')

    await choosePassword('diesel-pass-123', 'nope')

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })
})
