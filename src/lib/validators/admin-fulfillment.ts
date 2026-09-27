import { z } from 'zod'

import { CARRIERS, type Carrier } from '@/lib/fulfillment'

const CARRIER_VALUES = CARRIERS.map((carrier) => carrier.value) as [Carrier, ...Carrier[]]

// La misma regla que `TRACKING_NUMBER_PATTERN` del backend, que vuelve a
// validarla: letras, dígitos y guiones, de 1 a 64.
const TRACKING_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,64}$/

export const shipOrderSchema = z.object({
  carrier: z.enum(CARRIER_VALUES, { message: 'Choose a carrier' }),
  trackingNumber: z
    .string()
    .trim()
    .min(1, 'Enter the tracking number')
    .regex(TRACKING_NUMBER_PATTERN, 'Use 1 to 64 letters, digits or hyphens'),
})

export type ShipOrderValues = z.infer<typeof shipOrderSchema>
