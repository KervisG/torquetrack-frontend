import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

export type LoginValues = z.infer<typeof loginSchema>
