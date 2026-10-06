import { z } from 'zod'

import { isUsStateCode } from '@/lib/us-states'

// Igual que el backend (`apps/common/contact.py`): 10 a 15 dígitos sin contar
// espacios, guiones, paréntesis, puntos ni el `+`; las letras no son formato.
export function isPlausiblePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '').length
  return /^[\d\s()+.-]*$/.test(value) && digits >= 10 && digits <= 15
}

export const checkoutCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Full name required'),
  company: z.string().optional(),
  email: z.email('Valid email required'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isPlausiblePhone(value), 'Phone must have 10 to 15 digits'),
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
