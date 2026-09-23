import { useMutation, useQueryClient } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'

import { createPaymentLink, takePayment } from '../api'
import { adminOrderKeys } from '../query-keys'

// Sin Stripe configurado las dos acciones fallan con el 502 del backend, que
// se muestra tal cual.
export function PaymentActions({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })
  const link = useMutation({ mutationFn: () => createPaymentLink(orderId), onSuccess: refresh })
  const take = useMutation({ mutationFn: () => takePayment(orderId), onSuccess: refresh })
  const busy = link.isPending || take.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            link.reset()
            take.mutate()
          }}
        >
          {take.isPending ? 'Starting…' : 'Take payment'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            take.reset()
            link.mutate()
          }}
        >
          {link.isPending ? 'Creating…' : 'Create payment link'}
        </Button>
      </div>
      <FormError error={take.error ?? link.error} />
      {take.data ? (
        <p className="text-sm">
          <a
            href={take.data.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Open secure payment page
          </a>
        </p>
      ) : null}
      {link.data ? (
        <div className="space-y-2">
          <FormField
            id={`payment-link-${orderId}`}
            label="Payment link"
            readOnly
            value={link.data.url}
            onFocus={(event) => event.currentTarget.select()}
          />
          <p className="text-sm text-muted-foreground">
            {link.data.emailed
              ? 'The link was emailed to the customer.'
              : 'The link was not emailed. Share it with the customer.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
