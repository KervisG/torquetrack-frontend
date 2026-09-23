import { z } from 'zod'

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
  state: z.string().trim().max(2, 'Use the 2-letter state code'),
  zip: z.string().trim(),
})

export type AdminCustomerValues = z.infer<typeof adminCustomerSchema>
