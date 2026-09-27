import { apiRequest } from '@/lib/api-client'

import type { AdminRole, AdminUser } from './types'

type RawUser = Omit<AdminUser, 'createdAt'> & { createdAt: string }

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await apiRequest<RawUser[]>('/admin/users')
  return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }))
}

export function listRoles(): Promise<AdminRole[]> {
  return apiRequest<AdminRole[]>('/admin/roles')
}

// `role: null` quita el acceso al panel; la cuenta queda como cliente. El
// backend rechaza con 400 cualquier otro campo.
export function updateUser(
  id: string,
  patch: { role: string | null; active: boolean },
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export function deleteUser(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
