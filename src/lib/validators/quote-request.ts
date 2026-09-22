import { z } from 'zod'

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name or company is required'),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
})

export type QuoteRequestValues = z.infer<typeof quoteRequestSchema>
