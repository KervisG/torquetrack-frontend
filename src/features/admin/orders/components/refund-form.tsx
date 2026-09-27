import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { createRefundSchema, type RefundValues } from '@/lib/validators/admin-refund'

import { refundOrder } from '../api'
import { adminOrderKeys } from '../query-keys'

type RefundFormProps = {
  orderId: string
  refundableAmount: number
}

// El saldo viene del backend; aquí solo se muestra y se usa como tope del
// formulario. Sin Stripe configurado el backend responde 502 y se muestra tal
// cual.
export function RefundForm({ orderId, refundableAmount }: RefundFormProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm<RefundValues>({
    resolver: zodResolver(createRefundSchema(refundableAmount)),
    defaultValues: { amount: '', reason: '' },
  })
  const refund = useMutation({
    mutationFn: ({ amount, reason }: RefundValues) =>
      refundOrder(orderId, {
        ...(amount ? { amount: Number(amount) } : {}),
        ...(reason ? { reason } : {}),
      }),
    onSuccess: async () => {
      form.reset()
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })
    },
  })

  if (!open) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refund.reset()
            setOpen(true)
          }}
        >
          Refund
        </Button>
        {refund.isSuccess ? (
          <p className="text-sm text-muted-foreground">
            Refund of {formatMoney(refund.data.amount)} is {refund.data.status.toLowerCase()}.
          </p>
        ) : null}
      </div>
    )
  }

  const { errors } = form.formState

  return (
    <form
      aria-label="Refund order"
      className="space-y-4 rounded-md border p-4"
      noValidate
      onSubmit={form.handleSubmit((values) => refund.mutate(values))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`refund-amount-${orderId}`}
          label="Amount"
          inputMode="decimal"
          placeholder={refundableAmount.toFixed(2)}
          error={errors.amount?.message}
          hint={
            <p className="text-sm text-muted-foreground">
              Leave empty to refund the full balance of {formatMoney(refundableAmount)}.
            </p>
          }
          {...form.register('amount')}
        />
        <FormField
          id={`refund-reason-${orderId}`}
          label="Reason"
          error={errors.reason?.message}
          {...form.register('reason')}
        />
      </div>
      <FormError error={refund.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={refund.isPending}>
          {refund.isPending ? 'Refunding…' : 'Confirm refund'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
