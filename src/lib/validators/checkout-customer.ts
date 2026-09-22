import { z } from 'zod'

export const checkoutCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Full name required'),
  company: z.string().optional(),
  email: z.email('Valid email required'),
  phone: z.string().optional(),
  address1: z.string().trim().min(1, 'Street address required'),
  address2: z.string().optional(),
  city: z.string().trim().min(1, 'City required'),
  state: z.string().trim().min(2, 'State required').max(2),
  zip: z.string().trim().min(1, 'ZIP required'),
  country: z.string().trim().min(1),
})

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>
