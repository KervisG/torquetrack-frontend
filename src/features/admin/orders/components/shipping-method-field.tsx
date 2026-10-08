import { useMutation, useQueryClient } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { SelectField } from '@/components/select-field'

import { updateShippingMethod } from '../api'
import { adminOrderKeys } from '../query-keys'
import { SHIPPING_METHODS, type ShippingMethod } from '../types'

const OPTIONS = [{ value: '', label: 'Select a method' }, ...SHIPPING_METHODS]

type ShippingMethodFieldProps = {
  orderId: string
  method: string
  // Método que vino del checkout (UPS · Ground) y no es una de las tres opciones.
  currentLabel: string
}

export function ShippingMethodField({ orderId, method, currentLabel }: ShippingMethodFieldProps) {
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: (shippingMethod: ShippingMethod) => updateShippingMethod(orderId, shippingMethod),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })
    },
  })

  return (
    <div className="space-y-2">
      <SelectField
        id="order-shipping-method"
        label="Shipping method"
        value={method}
        options={OPTIONS}
        disabled={update.isPending}
        onChange={(event) => {
          const next = event.target.value
          if (next) update.mutate(next as ShippingMethod)
        }}
      />
      {currentLabel ? <p className="text-sm font-medium">{currentLabel}</p> : null}
      <FormError error={update.error} friendly />
    </div>
  )
}
