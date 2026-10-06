import { useState } from 'react'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useVehicleStore } from '@/stores/vehicle-store'

import { decodeVin } from '../api'

type VinFormProps = {
  id: string
  initialVin?: string
  label?: string
  submitLabel?: string
  // `inline` pone el botón al lado del campo (hero); `stacked` lo deja abajo
  // a todo el ancho (diálogo del vehículo).
  layout?: 'stacked' | 'inline'
  labelClassName?: string
  errorClassName?: string
}

// Única búsqueda por VIN de la tienda: la usan el hero del catálogo y el
// diálogo de "My vehicle". Un VIN decodificado queda guardado como vehículo.
export function VinForm({
  id,
  initialVin = '',
  label = 'VIN',
  submitLabel = 'Save vehicle',
  layout = 'stacked',
  labelClassName,
  errorClassName,
}: VinFormProps) {
  const setVehicle = useVehicleStore((state) => state.setVehicle)
  const [vin, setVin] = useState(initialVin)
  const [error, setError] = useState('')
  const [decoding, setDecoding] = useState(false)

  async function onDecode() {
    const typed = vin.trim().toUpperCase()
    setError('')
    setDecoding(true)
    try {
      const result = await decodeVin(typed)
      setVehicle({ ...result.vehicle, vin: typed, source: 'vin' })
    } catch (decodeError) {
      setError(decodeError instanceof ApiError ? decodeError.message : 'VIN lookup failed')
    } finally {
      setDecoding(false)
    }
  }

  const submit = (
    <StorefrontButton
      type="submit"
      className={cn(layout === 'inline' ? 'h-11 shrink-0' : 'w-full')}
      disabled={!vin.trim() || decoding}
    >
      {decoding ? 'Looking up VIN…' : submitLabel}
    </StorefrontButton>
  )

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        void onDecode()
      }}
    >
      <FormField
        id={id}
        label={label}
        labelClassName={labelClassName}
        value={vin}
        onChange={(event) => setVin(event.target.value.toUpperCase())}
        maxLength={17}
        placeholder="17-character VIN"
        spellCheck={false}
        autoComplete="off"
        // text-foreground: sobre el hero oscuro el campo heredaría texto blanco.
        className="h-11 font-mono text-base tracking-wide text-foreground md:text-base"
        action={layout === 'inline' ? submit : undefined}
      />
      {error ? (
        <p role="alert" className={cn('text-sm text-destructive', errorClassName)}>
          {error}
        </p>
      ) : null}
      {layout === 'stacked' ? submit : null}
    </form>
  )
}
