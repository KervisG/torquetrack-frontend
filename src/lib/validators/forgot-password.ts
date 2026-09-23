import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.email('Valid email required'),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
