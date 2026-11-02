import { z } from 'zod'

// La misma regla que `add_order_note` del backend, que vuelve a validarla:
// texto sin espacios sobrantes, de 1 a 2000 caracteres.
export const MAX_ORDER_NOTE_LENGTH = 2000

export const orderNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a note')
    .max(MAX_ORDER_NOTE_LENGTH, `Use ${MAX_ORDER_NOTE_LENGTH} characters or fewer`),
})

export type OrderNoteValues = z.infer<typeof orderNoteSchema>
