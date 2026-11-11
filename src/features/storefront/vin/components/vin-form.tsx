import { useState } from 'react'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { describeVehicle, useVehicleStore, type SavedVehicle } from '@/stores/vehicle-store'

import { decodeVin, type VinDecodeResult, type VinVehicleField } from '../api'

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
  // La portada lleva al catálogo en cuanto el vehículo queda guardado.
  onDecoded?: () => void
  // El diálogo del vehículo cambia a Year / Make / Model para completar lo
  // que el VIN no trajo; sin esta prop el botón no aparece.
  onCompleteManually?: () => void
}

type VinNotice = {
  vehicle: SavedVehicle
  missingFields: VinVehicleField[]
  checkDigit: boolean
}

const FIELD_LABELS: Record<VinVehicleField, string> = {
  year: 'Year',
  make: 'Make',
  model: 'Model',
  engine: 'Engine',
}

// Única búsqueda por VIN de la tienda: la usan el hero del catálogo y el
// diálogo de "My vehicle". Un VIN decodificado queda guardado como vehículo;
// si vino incompleto o con el dígito verificador mal, se avisa antes de seguir.
export function VinForm({
  id,
  initialVin = '',
  label = 'VIN',
  submitLabel = 'Save vehicle',
  layout = 'stacked',
  labelClassName,
  errorClassName,
  onDecoded,
  onCompleteManually,
}: VinFormProps) {
  const setVehicle = useVehicleStore((state) => state.setVehicle)
  const setSelectorOpen = useVehicleStore((state) => state.setSelectorOpen)
  const [vin, setVin] = useState(initialVin)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<VinNotice | null>(null)
  const [decoding, setDecoding] = useState(false)

  async function onDecode() {
    const typed = vin.trim().toUpperCase()
    setError('')
    setNotice(null)
    setDecoding(true)
    try {
      const result = await decodeVin(typed)
      const saved = toSavedVehicle(result, typed)
      const missingFields = result.missingFields ?? []
      const checkDigit = (result.warnings ?? []).includes('check_digit')
      if (missingFields.length > 0 || checkDigit) {
        // Se guarda igual, pero el diálogo queda abierto para leer el aviso.
        setVehicle(saved, { keepSelectorOpen: true })
        setNotice({ vehicle: saved, missingFields, checkDigit })
        return
      }
      setVehicle(saved)
      onDecoded?.()
    } catch (decodeError) {
      setError(decodeError instanceof ApiError ? decodeError.message : 'VIN lookup failed')
    } finally {
      setDecoding(false)
    }
  }

  function onDone() {
    setNotice(null)
    setSelectorOpen(false)
    onDecoded?.()
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
      {/* El botón sigue visible con el aviso: corregir un VIN mal tipeado
          y volver a buscar puede traer los datos que faltan. */}
      {layout === 'stacked' ? submit : null}
      {notice ? (
        <VinNoticePanel notice={notice} onDone={onDone} onCompleteManually={onCompleteManually} />
      ) : null}
    </form>
  )
}

function VinNoticePanel({
  notice,
  onDone,
  onCompleteManually,
}: {
  notice: VinNotice
  onDone: () => void
  onCompleteManually?: () => void
}) {
  const missing = notice.missingFields.map((field) => FIELD_LABELS[field]).join(', ')

  return (
    // Fondo propio: el panel se lee igual en el diálogo y sobre el hero oscuro.
    <div role="status" className="space-y-3 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
      {notice.checkDigit ? (
        <p>
          <span className="font-semibold">This VIN may have a typo.</span> Double-check it against
          your door jamb or dashboard.
        </p>
      ) : null}
      {missing ? (
        <div className="space-y-1">
          <p className="font-semibold">Your VIN didn't include all vehicle details</p>
          <p>{describeVehicle(notice.vehicle)}</p>
          <p>
            <span className="font-medium">Not returned by the VIN: {missing}.</span> Parts shown may
            not all fit your truck.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {missing && onCompleteManually ? (
          <StorefrontButton type="button" tone="outline" onClick={onCompleteManually}>
            Complete with Year / Make / Model
          </StorefrontButton>
        ) : null}
        <StorefrontButton type="button" onClick={onDone}>
          Done
        </StorefrontButton>
      </div>
    </div>
  )
}

// `engine` queda en litros para el fitment; `engineLabel` suma el modelo de
// motor que trae el VIN ("6.4L International Maxxforce 7").
function toSavedVehicle(result: VinDecodeResult, vin: string): SavedVehicle {
  const { year, make, model, engine, engineModel = '' } = result.vehicle
  const liters = /^\d+(\.\d+)?$/.test(engine) ? `${engine}L` : engine
  const engineLabel = engineModel && engineModel !== engine ? `${liters} ${engineModel}` : liters
  return { vin, year, make, model, engine, source: 'vin', engineLabel }
}
