export type AdminSessionUser = {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  name: string
  role: string
  permissions: string[]
}

export type AdminSession = {
  authenticated: true
  user: AdminSessionUser
}

export type AdminLoginResponse = {
  ok: true
  user: {
    id: string
    email: string
    username: string
    role: string
  }
}

export type AdminRegisterResponse = {
  ok: true
  user: AdminSessionUser & {
    roleSlug: string
    active: boolean
  }
}

export function hasAdminPermission(
  user: AdminSessionUser,
  permission: string,
): boolean {
  return user.permissions.includes('*') || user.permissions.includes(permission)
}
