import { z } from 'zod'

const amount = z.number({ error: 'Enter an amount' }).min(0, 'Must be 0 or more')

const MIN_YEAR = 1900
const MAX_YEAR = new Date().getFullYear() + 2

// Precio y años se editan como texto: vacío significa "sin dato" en lugar de
// un 0 que pasaría por válido.
const optionalYear = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}$/.test(value), 'Enter a 4-digit year')
  .refine(
    (value) => !value || (Number(value) >= MIN_YEAR && Number(value) <= MAX_YEAR),
    `Enter a year between ${MIN_YEAR} and ${MAX_YEAR}`,
  )

const requiredPrice = z
  .string()
  .trim()
  .min(1, 'Price is required')
  .refine((value) => Number.isFinite(Number(value)), 'Enter a valid price')
  .refine((value) => Number(value) > 0, 'Price must be greater than $0')

// Sin `pricing.edit` el precio no se edita: no se valida lo que no se puede tocar.
export function buildAdminProductSchema({ requirePrice }: { requirePrice: boolean }) {
  return z
    .object({
      title: z.string().trim().min(1, 'Title is required'),
      partNumber: z.string().trim().min(1, 'Part number is required'),
      category: z.string().trim(),
      condition: z.string().trim(),
      make: z.string().trim(),
      model: z.string().trim(),
      yearFrom: optionalYear,
      yearTo: optionalYear,
      engine: z.string().trim(),
      price: requirePrice ? requiredPrice : z.string().trim(),
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
      // Códigos de `/api/admin/applications/`; el backend rechaza uno inexistente.
      applicationIds: z.array(z.string()),
    })
    .refine((values) => !values.yearFrom || !values.yearTo || Number(values.yearTo) >= Number(values.yearFrom), {
      message: 'Year to must be the same as or after year from',
      path: ['yearTo'],
    })
}

export const adminProductSchema = buildAdminProductSchema({ requirePrice: true })

export type AdminProductValues = z.infer<typeof adminProductSchema>

// Texto del formulario → número del payload; vacío no manda dato.
export function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}
