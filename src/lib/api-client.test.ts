import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '@/test/msw-server'

import { apiRequest, clearCsrfToken } from './api-client'

function captureCsrfHeaderOn(path: string) {
  const seen: { header: string | null } = { header: 'unset' }
  server.use(
    http.post(path, ({ request }) => {
      seen.header = request.headers.get('X-CSRFToken')
      return HttpResponse.json({ ok: true })
    }),
  )
  return seen
}

describe('apiRequest', () => {
  afterEach(() => {
    clearCsrfToken()
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('sends the CSRF token returned by the session endpoint on unsafe methods', async () => {
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({ authenticated: true, user: {}, csrfToken: 'from-session' }),
      ),
    )
    const seen = captureCsrfHeaderOn('/api/logout/')

    await apiRequest('/session')
    await apiRequest('/logout', { method: 'POST' })

    expect(seen.header).toBe('from-session')
  })

  it('keeps the CSRF token from a 401 session response', async () => {
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({ error: 'Unauthorized', csrfToken: 'anonymous-token' }, { status: 401 }),
      ),
    )
    const seen = captureCsrfHeaderOn('/api/login/')

    await expect(apiRequest('/session')).rejects.toMatchObject({ status: 401 })
    await apiRequest('/login', { method: 'POST', body: '{}' })

    expect(seen.header).toBe('anonymous-token')
  })

  it('uses the rotated CSRF token returned by login', async () => {
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({ error: 'Unauthorized', csrfToken: 'before-login' }, { status: 401 }),
      ),
      http.post('/api/login/', () =>
        HttpResponse.json({ authenticated: true, user: {}, csrfToken: 'after-login' }),
      ),
    )
    const seen = captureCsrfHeaderOn('/api/logout/')

    await apiRequest('/session').catch(() => null)
    await apiRequest('/login', { method: 'POST', body: '{}' })
    await apiRequest('/logout', { method: 'POST' })

    expect(seen.header).toBe('after-login')
  })

  it('fetches the session once to get a CSRF token before the first unsafe request', async () => {
    let sessionCalls = 0
    server.use(
      http.get('/api/session/', () => {
        sessionCalls += 1
        return HttpResponse.json({ error: 'Unauthorized', csrfToken: 'bootstrapped' }, { status: 401 })
      }),
    )
    const seen = captureCsrfHeaderOn('/api/cart/sync/')

    await apiRequest('/cart/sync', { method: 'POST', body: '{}' })
    await apiRequest('/cart/sync', { method: 'POST', body: '{}' })

    expect(seen.header).toBe('bootstrapped')
    expect(sessionCalls).toBe(1)
  })

  it('does not read the token from document.cookie', async () => {
    document.cookie = 'csrftoken=cookie-token; path=/'
    server.use(
      http.get('/api/session/', () =>
        HttpResponse.json({ error: 'Unauthorized', csrfToken: 'body-token' }, { status: 401 }),
      ),
    )
    const seen = captureCsrfHeaderOn('/api/logout/')

    await apiRequest('/logout', { method: 'POST' })

    expect(seen.header).toBe('body-token')
  })

  it('does not send the CSRF token on safe methods', async () => {
    let header: string | null = 'unset'
    server.use(
      http.get('/api/session/', ({ request }) => {
        header = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ authenticated: true, user: {}, csrfToken: 'token-123' })
      }),
    )

    await apiRequest('/session')
    await apiRequest('/session')

    expect(header).toBeNull()
  })
})
