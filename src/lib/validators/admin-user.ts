import { z } from 'zod'

// La política de contraseñas la aplica el backend; su 400 se muestra tal cual.
export const createUserSchema = z.object({
  email: z.email('Valid email required'),
  password: z.string().min(1, 'Password required'),
  firstName: z.string().trim().min(1, 'First name required'),
  lastName: z.string().trim().min(1, 'Last name required'),
  role: z.string().min(1, 'Select a role'),
})

export type CreateUserValues = z.infer<typeof createUserSchema>

// `role` vacío significa "sin Role": la cuenta pasa a ser cliente.
export const editUserSchema = z.object({
  role: z.string(),
  active: z.boolean(),
  password: z.string(),
})

export type EditUserValues = z.infer<typeof editUserSchema>
