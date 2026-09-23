import type { SessionRole } from '@/features/account/auth/types'

export type AdminRole = SessionRole & { id: number }

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
