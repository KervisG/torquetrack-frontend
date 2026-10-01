import { z } from 'zod'

import { isUsStateCode } from '@/lib/us-states'

// El email es opcional (un cliente de mostrador puede no tenerlo), pero sin
// él no hay invitación al portal ni envío de cotizaciones.
export const optionalEmail = z.union([z.literal(''), z.email('Valid email required')])

export const adminCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  company: z.string().trim(),
  email: optionalEmail,
  phone: z.string().trim(),
  address1: z.string().trim(),
  city: z.string().trim(),
  // El backend rechaza un estado fuera de la lista que usa el checkout.
  state: z
    .string()
    .trim()
    .refine((value) => !value || isUsStateCode(value), 'Use a valid 2-letter US state code'),
  zip: z.string().trim(),
})

export type AdminCustomerValues = z.infer<typeof adminCustomerSchema>
