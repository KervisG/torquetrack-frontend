import { z } from 'zod'

import { isUsStateCode } from '@/lib/us-states'

export const checkoutCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Full name required'),
  company: z.string().optional(),
  email: z.email('Valid email required'),
  phone: z.string().optional(),
  address1: z.string().trim().min(1, 'Street address required'),
  address2: z.string().optional(),
  city: z.string().trim().min(1, 'City required'),
  // El backend rechaza el checkout sin un estado válido: decide el impuesto.
  state: z
    .string()
    .trim()
    .min(1, 'Select a state')
    .refine(isUsStateCode, 'Select a valid US state'),
  zip: z
    .string()
    .trim()
    .min(1, 'ZIP required')
    .regex(/^\d{5}(-\d{4})?$/, 'Enter a 5-digit ZIP or ZIP+4'),
  country: z.string().trim().min(1),
})

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>
