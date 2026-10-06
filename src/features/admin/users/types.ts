import type { SessionRole } from '@/features/account/auth/types'

export type AdminRole = SessionRole & { id: number; permissions: string[] }

export type AdminUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  active: boolean
  isStaff: boolean
  // `null` es un cliente: tiene cuenta pero no panel.
  role: SessionRole | null
  permissions: string[]
  createdAt: Date
}

// `name` del backend cae al email cuando la cuenta no tiene nombre; el panel
// muestra solo el nombre real.
export function userDisplayName(user: Pick<AdminUser, 'firstName' | 'lastName'>): string {
  return [user.firstName, user.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ')
}
