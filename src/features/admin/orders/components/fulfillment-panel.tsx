import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format-date'
import {
  CARRIERS,
  carrierLabel,
  fulfillmentBadgeVariant,
  fulfillmentLabel,
} from '@/lib/fulfillment'
import { shipOrderSchema, type ShipOrderValues } from '@/lib/validators/admin-fulfillment'

import { updateFulfillment, type FulfillmentUpdate } from '../api'
import { adminOrderKeys } from '../query-keys'
import { canFulfill, type AdminOrder } from '../types'

type FulfillmentPanelProps = {
  order: AdminOrder
  canUpdate: boolean
}

// Las acciones siguen el orden del backend (UNFULFILLED -> PREPARING ->
// SHIPPED -> DELIVERED, con salto directo a SHIPPED); el backend vuelve a
// validar cada transición y responde 409 si el pedido cambió mientras tanto.
export function FulfillmentPanel({ order, canUpdate }: FulfillmentPanelProps) {
  const queryClient = useQueryClient()
  const [shipping, setShipping] = useState(false)
  const update = useMutation({
    mutationFn: (body: FulfillmentUpdate) => updateFulfillment(order.id, body),
    onSuccess: async () => {
      setShipping(false)
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })
    },
  })

  const status = order.fulfillmentStatus
  const showActions = canUpdate && canFulfill(order)

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Fulfillment status</dt>
          <dd className="mt-1">
            <Badge variant={fulfillmentBadgeVariant(status)}>{fulfillmentLabel(status)}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Carrier</dt>
          <dd className="font-medium">{order.carrier ? carrierLabel(order.carrier) : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tracking number</dt>
          <dd className="font-medium">
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {order.trackingNumber}
              </a>
            ) : (
              order.trackingNumber || '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Shipped / delivered</dt>
          <dd className="font-medium">
            {order.shippedAt ? formatDate(order.shippedAt) : '—'}
            {order.deliveredAt ? ` · ${formatDate(order.deliveredAt)}` : ''}
          </dd>
        </div>
      </dl>
      {!canFulfill(order) && status === 'UNFULFILLED' ? (
        <p className="text-sm text-muted-foreground">
          Only paid, open orders can be fulfilled.
        </p>
      ) : null}
      {showActions && !shipping ? (
        <div className="flex flex-wrap gap-2">
          {status === 'UNFULFILLED' ? (
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() => update.mutate({ status: 'PREPARING' })}
            >
              Mark preparing
            </Button>
          ) : null}
          {status === 'UNFULFILLED' || status === 'PREPARING' ? (
            <Button
              type="button"
              onClick={() => {
                update.reset()
                setShipping(true)
              }}
            >
              Mark shipped
            </Button>
          ) : null}
          {status === 'SHIPPED' ? (
            <>
              <Button
                type="button"
                disabled={update.isPending}
                onClick={() => update.mutate({ status: 'DELIVERED' })}
              >
                Mark delivered
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  update.reset()
                  setShipping(true)
                }}
              >
                Correct tracking
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      {showActions && shipping ? (
        <ShipForm
          order={order}
          pending={update.isPending}
          onCancel={() => setShipping(false)}
          onSubmit={(values) => update.mutate({ status: 'SHIPPED', ...values })}
        />
      ) : null}
      <FormError error={update.error} />
      {update.isSuccess ? (
        <p className="text-sm text-muted-foreground">Fulfillment updated.</p>
      ) : null}
    </div>
  )
}

type ShipFormProps = {
  order: AdminOrder
  pending: boolean
  onCancel: () => void
  onSubmit: (values: ShipOrderValues) => void
}

function ShipForm({ order, pending, onCancel, onSubmit }: ShipFormProps) {
  const form = useForm<ShipOrderValues>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues: {
      carrier: CARRIERS.find((option) => option.value === order.carrier)?.value ?? 'UPS',
      trackingNumber: order.trackingNumber,
    },
  })
  const { errors } = form.formState

  return (
    <form
      aria-label="Ship order"
      className="space-y-4 rounded-md border p-4"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={`ship-carrier-${order.id}`}
          label="Carrier"
          options={CARRIERS}
          error={errors.carrier?.message}
          {...form.register('carrier')}
        />
        <FormField
          id={`ship-tracking-${order.id}`}
          label="Tracking number"
          autoComplete="off"
          error={errors.trackingNumber?.message}
          {...form.register('trackingNumber')}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        The customer gets an email with the carrier and tracking link.
      </p>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save shipment'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
