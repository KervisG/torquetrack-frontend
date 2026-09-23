import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, customerUser, sessionUser } from '@/test/admin-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

function header() {
  return within(screen.getByRole('banner'))
}

describe('Storefront home', () => {
  it('renders the shop catalog on /', async () => {
    server.use(productsOk())
    renderApp('/')

    expect(await screen.findByRole('heading', { name: /find it/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument()
  })

  it('offers a single sign in when logged out', async () => {
    server.use(productsOk())
    renderApp('/')

    expect(await header().findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(header().queryByRole('link', { name: 'My account' })).not.toBeInTheDocument()
  })

  it('shows the account link without Admin for a customer', async () => {
    server.use(authenticatedSession(customerUser), productsOk())
    renderApp('/')

    expect(await header().findByRole('link', { name: 'My account' })).toHaveAttribute(
      'href',
      '/account',
    )
    expect(header().queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(header().queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('adds the Admin link for staff', async () => {
    server.use(authenticatedSession(sessionUser), productsOk())
    renderApp('/')

    expect(await header().findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('signs out back to the anonymous header', async () => {
    let signedIn = true
    server.use(
      http.get('/api/session/', () =>
        signedIn
          ? HttpResponse.json({ authenticated: true, user: customerUser, csrfToken: 't' })
          : HttpResponse.json({ error: 'Unauthorized', csrfToken: 't' }, { status: 401 }),
      ),
      http.post('/api/logout/', () => {
        signedIn = false
        return HttpResponse.json({ ok: true })
      }),
      productsOk(),
    )
    renderApp('/')

    const user = userEvent.setup()
    await user.click(await header().findByRole('button', { name: 'Sign out' }))

    expect(await header().findByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })
})
