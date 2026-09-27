import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'

import { updateOrderStatus } from '../api'
import { adminOrderKeys } from '../query-keys'
import { ORDER_STATUSES, nextOrderStatuses } from '../types'

type OrderStatusFormProps = {
  orderId: string
  status: string
  canChange: boolean
  canCancel: boolean
}

// El backend exige `orders.cancel` para CANCELLED y `orders.status` para el
// resto, y solo acepta el paso siguiente (`nextOrderStatuses`).
export function OrderStatusForm({ orderId, status, canChange, canCancel }: OrderStatusFormProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(status)
  const update = useMutation({
    mutationFn: (next: string) => updateOrderStatus(orderId, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminOrderKeys.all }),
  })
  const allowed = nextOrderStatuses(status).filter((value) =>
    value === 'CANCELLED' ? canCancel : canChange,
  )
  const known = (ORDER_STATUSES as readonly string[]).includes(status)
  const values = known ? [status, ...allowed.filter((value) => value !== status)] : [status]

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        update.mutate(selected)
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56">
          <SelectField
            id={`order-status-${orderId}`}
            label="Order status"
            options={values.map((value) => ({ value, label: value }))}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={update.isPending || selected === status}>
          {update.isPending ? 'Saving…' : 'Update status'}
        </Button>
      </div>
      <FormError error={update.error} />
      {update.isSuccess ? <p className="text-sm text-muted-foreground">Status updated.</p> : null}
    </form>
  )
}
