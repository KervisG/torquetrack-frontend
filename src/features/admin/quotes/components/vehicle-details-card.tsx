import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { QuoteVehicle, QuoteVehicleDetails, QuoteVehicleSpec } from '../types'

// El motor va en el encabezado; aquí solo los datos de apoyo. Orden de
// lectura: lo mecánico primero, después carrocería y al final el origen.
const FIELDS: Array<{ key: keyof QuoteVehicleDetails; label: string }> = [
  { key: 'drivetrain', label: 'Drivetrain' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'horsepower', label: 'Horsepower' },
  { key: 'body', label: 'Body' },
  { key: 'cab', label: 'Cab' },
  { key: 'trim', label: 'Trim' },
  { key: 'series', label: 'Series' },
  { key: 'vehicleType', label: 'Type' },
  { key: 'gvwr', label: 'GVWR' },
  { key: 'brakes', label: 'Brakes' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'plant', label: 'Plant' },
]

type VehicleDetailsCardProps = {
  vehicle: QuoteVehicle
  // El detalle de la cotización ya nombra el vehículo arriba de la tarjeta.
  showHeadline?: boolean
}

// Ficha del VIN: primero qué vehículo es ("2014 Ram 2500" y su motor), y
// debajo los datos de NHTSA en dos columnas. Solo se muestra lo que llegó.
export function VehicleDetailsCard({ vehicle, showHeadline = true }: VehicleDetailsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const details = vehicle.details
  const specs = vehicle.specs ?? []
  if (!details) return null
  const rows = FIELDS.filter((field) => details[field.key])
  const name = vehicleName(vehicle)
  const engine = details.engine || (vehicle.engine ? `${vehicle.engine}L` : '')
  if (!rows.length && !name && !engine) return null

  return (
    <section aria-label="Vehicle info" className="rounded-md bg-muted/70 px-4 py-3">
      {showHeadline ? (
        <header className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h4 className="text-base font-semibold">{name || 'Unidentified vehicle'}</h4>
          {engine ? <p className="text-sm text-muted-foreground">{engine}</p> : null}
        </header>
      ) : engine ? (
        <p className="mb-1 text-sm font-medium">{engine}</p>
      ) : null}
      {rows.length ? (
        <SpecGrid rows={rows.map((field) => ({ label: field.label, value: details[field.key] }))} />
      ) : null}
      {specs.length ? (
        <div className="mt-2">
          <button
            type="button"
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            {expanded ? 'Fewer details' : `More details (${specs.length})`}
          </button>
          {expanded ? (
            <div className="mt-1">
              <SpecGrid rows={specs} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function SpecGrid({ rows }: { rows: QuoteVehicleSpec[] }) {
  return (
    <dl className="grid gap-x-8 text-xs sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 border-b border-border/70 py-1.5"
        >
          <dt className="shrink-0 font-semibold text-muted-foreground">{row.label}:</dt>
          <dd className="break-words text-right">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

// "2014 Ram 2500". Sin marca (algunos camiones solo traen el fabricante) se
// usa el fabricante sin la razón social: "International Motors".
function vehicleName(vehicle: QuoteVehicle): string {
  const make = vehicle.make || (vehicle.details?.manufacturer ?? '').split(',')[0].trim()
  return [vehicle.year, make, vehicle.model].filter(Boolean).join(' ')
}
