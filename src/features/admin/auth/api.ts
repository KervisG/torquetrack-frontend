import { apiRequest } from '@/lib/api-client'
import type { AdminLoginValues } from '@/lib/validators/admin-login'

import type { AdminLoginResponse, AdminSession } from './types'

export function getAdminSession(): Promise<AdminSession> {
  return apiRequest<AdminSession>('/admin/session')
}

export function loginAdmin(values: AdminLoginValues): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function logoutAdmin(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/admin/logout', { method: 'POST' })
}
