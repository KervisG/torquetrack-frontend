import { z } from 'zod'

// Mismos campos que `ACCOUNT_PROFILE_FIELDS` del backend: todo lo demás lo
// ignora el PATCH, así que no tiene sentido mandarlo. El backend corta a 200.
const text = z.string().trim().max(200, 'Maximum 200 characters')

export const accountProfileSchema = z.object({
  name: text.min(1, 'Full name required'),
  company: text,
  phone: text,
  address1: text,
  address2: text,
  city: text,
  state: text,
  zip: text,
  country: text,
})

export type AccountProfileValues = z.infer<typeof accountProfileSchema>
