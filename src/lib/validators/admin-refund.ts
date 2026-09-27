import { z } from 'zod'

// El monto es texto para que "vacío" signifique "reembolsar el saldo": con
// `valueAsNumber` un campo vacío llegaría como NaN. El backend vuelve a
// validar el monto contra el saldo con el pedido bloqueado; este límite solo
// evita un viaje que ya se sabe que falla.
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/

export function createRefundSchema(refundableAmount: number) {
  return z.object({
    amount: z
      .string()
      .trim()
      .refine((value) => value === '' || MONEY_PATTERN.test(value), {
        message: 'Enter an amount like 25.50',
      })
      .refine((value) => value === '' || Number(value) > 0, {
        message: 'Must be more than 0',
      })
      .refine((value) => value === '' || Number(value) <= refundableAmount, {
        message: 'Cannot exceed the refundable balance',
      }),
    reason: z.string().trim().max(500, 'Use 500 characters or fewer'),
  })
}

export type RefundValues = z.infer<ReturnType<typeof createRefundSchema>>
