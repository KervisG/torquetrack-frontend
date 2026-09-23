import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { unauthorizedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

const neutralMessage =
  'If an account exists for that email, we sent a link to reset the password.'

describe('ForgotPasswordPage', () => {
  it('is linked from the login page', async () => {
    server.use(unauthorizedSession())
    renderApp('/login')

    const user = userEvent.setup()
    await user.click(await screen.findByRole('link', { name: 'Forgot your password?' }))

    expect(await screen.findByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
  })

  it('shows the neutral confirmation after requesting a link', async () => {
    let sent: unknown
    server.use(
      unauthorizedSession(),
      http.post('/api/password-reset/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true, message: neutralMessage })
      }),
    )
    renderApp('/forgot-password')

    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'pat@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByText(neutralMessage)).toBeInTheDocument()
    expect(sent).toEqual({ email: 'pat@example.com' })
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument()
  })

  it('shows the API error when the request is throttled', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/password-reset/', () =>
        HttpResponse.json({ error: 'Request was throttled.' }, { status: 429 }),
      ),
    )
    renderApp('/forgot-password')

    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'pat@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('validates the email before calling the API', async () => {
    server.use(unauthorizedSession())
    renderApp('/forgot-password')

    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByText('Valid email required')).toBeInTheDocument()
  })
})
