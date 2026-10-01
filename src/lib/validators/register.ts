import { z } from 'zod'

import { newPasswordFields, passwordMismatch, passwordsMatch } from './new-password'

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name required'),
    phone: z.string().trim(),
    email: z.email('Valid email required'),
    ...newPasswordFields,
  })
  .refine(passwordsMatch, passwordMismatch)

export type RegisterValues = z.infer<typeof registerSchema>
