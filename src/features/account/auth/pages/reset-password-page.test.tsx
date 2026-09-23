import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { unauthorizedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

async function choosePassword(password = 'Fresh-Injector-2026!', confirm = password) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('New password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Reset password' }))
}

describe('ResetPasswordPage', () => {
  it('sets the new password and links to sign in', async () => {
    let sent: unknown
    server.use(
      unauthorizedSession(),
      http.post('/api/password-reset/confirm/', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    renderApp('/reset-password?token=tok123')

    await choosePassword()

    expect(await screen.findByText('Your password was reset.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(sent).toEqual({ token: 'tok123', password: 'Fresh-Injector-2026!' })
  })

  it('shows the API error for an expired link', async () => {
    server.use(
      unauthorizedSession(),
      http.post('/api/password-reset/confirm/', () =>
        HttpResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 }),
      ),
    )
    renderApp('/reset-password?token=old')

    await choosePassword()

    expect(await screen.findByText('Invalid or expired reset link')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  it('rejects mismatched passwords', async () => {
    server.use(unauthorizedSession())
    renderApp('/reset-password?token=tok123')

    await choosePassword('Fresh-Injector-2026!', 'nope')

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('explains a link without token', async () => {
    server.use(unauthorizedSession())
    renderApp('/reset-password')

    expect(await screen.findByText('This reset link is missing its token.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument()
  })
})
