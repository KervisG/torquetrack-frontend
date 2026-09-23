import { apiRequest } from '@/lib/api-client'
import type { ForgotPasswordValues } from '@/lib/validators/forgot-password'
import type { LoginValues } from '@/lib/validators/login'

import type { EmailVerification, PasswordResetRequested, Session } from './types'

export function getSession(): Promise<Session> {
  return apiRequest<Session>('/session')
}

export function login(values: LoginValues): Promise<Session> {
  return apiRequest<Session>('/login', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function register(payload: {
  name: string
  company: string
  phone: string
  email: string
  password: string
}): Promise<Session> {
  return apiRequest<Session>('/register', {
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
