import { z } from 'zod'

// El panel no crea cuentas ni cambia contraseñas: toda persona se registra
// como cliente y aquí solo se le asigna un Role o se activa/desactiva.
// `role` vacío significa "sin Role": la cuenta pasa a ser cliente.
export const editUserSchema = z.object({
  role: z.string(),
  active: z.boolean(),
})

export type EditUserValues = z.infer<typeof editUserSchema>
