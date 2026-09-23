export type SessionRole = {
  slug: string
  name: string
  fullAccess: boolean
}

// Una sola cuenta para clientes y staff: el acceso al panel lo da el Role.
export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  isStaff: boolean
  role: SessionRole | null
  permissions: string[]
}

export type Session = {
  authenticated: true
  user: SessionUser
}

export function displayName(user: SessionUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

export function hasAdminPermission(user: SessionUser, permission: string): boolean {
  if (!user.isStaff) return false
  return Boolean(user.role?.fullAccess) || user.permissions.includes(permission)
}
