import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '@/test/msw-server'

import { apiRequest } from './api-client'

function setCsrfCookie(value: string) {
  document.cookie = `csrftoken=${value}; path=/`
}

describe('apiRequest', () => {
  afterEach(() => {
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('sends the CSRF token on unsafe methods', async () => {
    setCsrfCookie('token-123')
    let header: string | null = null
    server.use(
      http.post('/api/logout/', ({ request }) => {
        header = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiRequest('/logout', { method: 'POST' })

    expect(header).toBe('token-123')
  })

  it('does not send the CSRF token on safe methods', async () => {
    setCsrfCookie('token-123')
    let header: string | null = 'unset'
    server.use(
      http.get('/api/session/', ({ request }) => {
        header = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiRequest('/session')

    expect(header).toBeNull()
  })
})
