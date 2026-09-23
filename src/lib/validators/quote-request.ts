import { z } from 'zod'

// El email es opcional (se puede pedir solo con teléfono), pero si se escribe
// tiene que servir: es a donde llega la confirmación.
export const quoteRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name or company is required'),
  email: z.union([z.literal(''), z.email('Valid email required')]),
  phone: z.string().trim(),
})

export type QuoteRequestValues = z.infer<typeof quoteRequestSchema>
