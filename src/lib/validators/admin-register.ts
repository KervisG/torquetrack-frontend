import { z } from 'zod'

export const adminRegisterSchema = z.object({
  firstName: z.string().trim().min(1, 'First name required'),
  lastName: z.string().trim().min(1, 'Last name required'),
  email: z.email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

export type AdminRegisterValues = z.infer<typeof adminRegisterSchema>
