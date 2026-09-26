import { z } from 'zod'

const amount = z.number({ error: 'Enter an amount' }).min(0, 'Must be 0 or more')
const whole = z.number({ error: 'Enter a number' }).int('Use a whole number').min(0, 'Must be 0 or more')

export const adminProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  partNumber: z.string().trim(),
  category: z.string().trim(),
  condition: z.string().trim(),
  make: z.string().trim(),
  model: z.string().trim(),
  yearFrom: whole,
  yearTo: whole,
  engine: z.string().trim(),
  price: amount,
  coreCharge: amount,
  fitment: z.string().trim(),
  description: z.string().trim(),
  warranty: z.string().trim(),
  shippingWeight: amount,
  packageLength: amount,
  packageWidth: amount,
  packageHeight: amount,
  image: z.string().trim(),
  supplier: z.string().trim(),
  supplierPartNumber: z.string().trim(),
  purchaseCost: amount,
  supplierUrl: z.string().trim(),
  internalNotes: z.string().trim(),
  active: z.boolean(),
})

export type AdminProductValues = z.infer<typeof adminProductSchema>
