import { apiRequest } from '@/lib/api-client'
import type { AdminLoginValues } from '@/lib/validators/admin-login'

import type { Session } from './types'

export function getSession(): Promise<Session> {
  return apiRequest<Session>('/session')
}

export function login(values: AdminLoginValues): Promise<Session> {
  return apiRequest<Session>('/login', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function logout(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/logout', { method: 'POST' })
}
