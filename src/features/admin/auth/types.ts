import type { SessionUser } from '@/features/account/auth/types'

export function hasAdminPermission(user: SessionUser, permission: string): boolean {
  if (!user.isStaff) return false
  return Boolean(user.role?.fullAccess) || user.permissions.includes(permission)
}
