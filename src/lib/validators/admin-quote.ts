import { z } from 'zod'

import { optionalEmail } from './admin-customer'

// Los inputs numéricos se registran con `valueAsNumber`: un campo vacío llega
// como NaN y `z.number` lo rechaza con este mensaje.
const amount = z.number({ error: 'Enter an amount' }).min(0, 'Must be 0 or more')

export const quoteLineSchema = z.object({
  productId: z.string().optional(),
  title: z.string().trim().min(1, 'Description is required'),
  partNumber: z.string().trim(),
  quantity: z
    .number({ error: 'Enter a quantity' })
    .int('Use a whole number')
    .min(1, 'At least 1'),
  unitPrice: amount,
  coreCharge: amount,
})

export const adminQuoteSchema = z.object({
  status: z.string().min(1),
  customer: z.object({
    name: z.string().trim().min(1, 'Customer name is required'),
    company: z.string().trim(),
    email: optionalEmail,
    phone: z.string().trim(),
  }),
  vehicle: z.object({
    year: z.string().trim(),
    make: z.string().trim(),
    model: z.string().trim(),
    engine: z.string().trim(),
    vin: z.string().trim().toUpperCase(),
  }),
  items: z.array(quoteLineSchema).min(1, 'Add at least one item'),
  shipping: amount,
  tax: amount,
  memo: z.string().trim(),
})

export type AdminQuoteValues = z.infer<typeof adminQuoteSchema>
export type QuoteLineValues = z.infer<typeof quoteLineSchema>
