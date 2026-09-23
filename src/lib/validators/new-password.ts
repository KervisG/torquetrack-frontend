import { z } from 'zod'

// Solo se exige que no esté vacía y que coincida: la política real
// (`AUTH_PASSWORD_VALIDATORS`) la aplica el backend y su 400 se muestra tal cual.
export const newPasswordFields = {
  password: z.string().min(1, 'Password required'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}

export function passwordsMatch(values: { password: string; confirmPassword: string }) {
  return values.password === values.confirmPassword
}

export const passwordMismatch = {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}

// Lo usan la activación del portal y el restablecimiento de contraseña.
export const newPasswordSchema = z
  .object(newPasswordFields)
  .refine(passwordsMatch, passwordMismatch)

export type NewPasswordValues = z.infer<typeof newPasswordSchema>
