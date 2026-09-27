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

// El backend exige estado y ZIP para calcular el impuesto (salvo un cliente
// exento), pero aquí no se exigen: el editor no sabe si el cliente está
// exento y el 400 del servidor ya trae el motivo.
export const quoteShippingAddressSchema = z.object({
  address1: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim().toUpperCase(),
  zip: z.string().trim(),
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
  shippingAddress: quoteShippingAddressSchema,
  // `tax` solo se envía como override (`taxOverride`); sin override el
  // backend lo calcula al guardar y este campo muestra la estimación.
  tax: amount,
  taxOverride: z.object({ enabled: z.boolean(), reason: z.string().trim() }),
  memo: z.string().trim(),
}).superRefine((values, context) => {
  if (values.taxOverride.enabled && !values.taxOverride.reason) {
    context.addIssue({
      code: 'custom',
      path: ['taxOverride', 'reason'],
      message: 'Enter a reason for the tax override',
    })
  }
})

export type AdminQuoteValues = z.infer<typeof adminQuoteSchema>
export type QuoteLineValues = z.infer<typeof quoteLineSchema>
