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
  // Sin verificar se puede comprar, pero el historial como invitado no se vincula.
  emailVerified: boolean
}

export type Session = {
  authenticated: true
  user: SessionUser
  // Token CSRF vigente; `api-client` lo guarda para los requests que mutan.
  csrfToken: string
}

export type PasswordResetRequested = {
  ok: true
  message: string
}

// Cuántos pedidos y cotizaciones de invitado se sumaron a la cuenta al verificar.
export type EmailVerification = {
  ok: true
  linkedOrders: number
  linkedQuotes: number
}

export function displayName(user: SessionUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

// Destino tras entrar: el staff trabaja en el panel y el cliente en su portal.
export function homePathFor(user: SessionUser): string {
  return user.isStaff ? '/admin' : '/account'
}
