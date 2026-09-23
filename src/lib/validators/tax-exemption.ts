import { z } from 'zod'

// Espejo de `MAX_CERTIFICATE_BYTES` y `CERTIFICATE_MIME_TYPES` de
// `apps/customers/services.py`: validar antes evita subir 1.5 MB para
// recibir un 400 o un 413.
const MAX_CERTIFICATE_BYTES = 1_500_000
export const CERTIFICATE_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

function firstFile(files: unknown): File | undefined {
  if (files && typeof files === 'object' && 'length' in files && 'item' in files) {
    return (files as FileList).item(0) ?? undefined
  }
  return undefined
}

export const taxExemptionSchema = z.object({
  company: z.string().trim().min(1, 'Company name is required'),
  taxId: z.string().trim().min(1, 'Tax ID / EIN is required'),
  taxState: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Use the two-letter state code'),
  taxExemptionType: z.string().trim(),
  certificate: z
    .custom<FileList | undefined>()
    .refine(
      (files) => {
        const file = firstFile(files)
        return !file || CERTIFICATE_MIME_TYPES.includes(file.type)
      },
      'Certificate must be a PDF, PNG or JPEG file',
    )
    .refine(
      (files) => {
        const file = firstFile(files)
        return !file || file.size <= MAX_CERTIFICATE_BYTES
      },
      'Certificate must be 1.5 MB or smaller',
    )
    .transform(firstFile),
})

export type TaxExemptionInput = z.input<typeof taxExemptionSchema>
export type TaxExemptionValues = z.output<typeof taxExemptionSchema>
