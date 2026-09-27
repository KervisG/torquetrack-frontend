import { apiRequest } from '@/lib/api-client'
import type { ForgotPasswordValues } from '@/lib/validators/forgot-password'
import type { LoginValues } from '@/lib/validators/login'

import type {
  EmailVerification,
  PasswordResetRequested,
  RegistrationAccepted,
  Session,
} from './types'

export function getSession(): Promise<Session> {
  return apiRequest<Session>('/session')
}

export function login(values: LoginValues): Promise<Session> {
  return apiRequest<Session>('/login', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

// No abre sesión y responde lo mismo exista o no la cuenta, para no revelar
// qué correos están registrados: la persona entra después de verificar o con
// su contraseña desde `/login`.
export function register(payload: {
  name: string
  company: string
  phone: string
  email: string
  password: string
}): Promise<RegistrationAccepted> {
  return apiRequest<RegistrationAccepted>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function activate(payload: { token: string; password: string }): Promise<Session> {
  return apiRequest<Session>('/activate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/logout', { method: 'POST' })
}

// Responde lo mismo exista o no la cuenta: el mensaje es siempre neutro.
export function requestPasswordReset(values: ForgotPasswordValues): Promise<PasswordResetRequested> {
  return apiRequest<PasswordResetRequested>('/password-reset', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function confirmPasswordReset(payload: {
  token: string
  password: string
}): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyEmail(token: string): Promise<EmailVerification> {
  return apiRequest<EmailVerification>('/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function resendVerificationEmail(): Promise<{ ok: true; emailVerified: boolean }> {
  return apiRequest<{ ok: true; emailVerified: boolean }>('/verify-email/resend', {
    method: 'POST',
  })
}
