import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { SelectField } from '@/components/select-field'
import { StorefrontButton } from '@/components/storefront-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VinForm } from '@/features/storefront/vin/components/vin-form'
import { ApiError } from '@/lib/api-client'
import { describeVehicle, useVehicleStore } from '@/stores/vehicle-store'

import { listApplications } from '../api'
import { garageKeys } from '../query-keys'
import type { VehicleApplication } from '../types'

// Montado una vez en `StorefrontShell`; cualquier página lo abre con
// `setSelectorOpen(true)` del store.
export function VehicleSelectorDialog() {
  const open = useVehicleStore((state) => state.selectorOpen)
  const setOpen = useVehicleStore((state) => state.setSelectorOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>My vehicle</DialogTitle>
          <DialogDescription>Save your truck to see the parts that fit it.</DialogDescription>
        </DialogHeader>
        {/* Radix desmonta el contenido al cerrar: cada apertura arranca limpia. */}
        <VehicleSelectorForm />
      </DialogContent>
    </Dialog>
  )
}

function VehicleSelectorForm() {
  const vehicle = useVehicleStore((state) => state.vehicle)
  const clearVehicle = useVehicleStore((state) => state.clearVehicle)
  const [mode, setMode] = useState<'selector' | 'vin'>(vehicle?.source === 'vin' ? 'vin' : 'selector')

  return (
    <div className="space-y-4">
      {vehicle ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2 text-sm">
          <span>
            <span className="text-muted-foreground">Saved: </span>
            <span className="font-medium">{describeVehicle(vehicle)}</span>
          </span>
          <StorefrontButton type="button" tone="danger" className="h-auto p-0" onClick={clearVehicle}>
            Clear
          </StorefrontButton>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Find your vehicle by">
        <StorefrontButton
          type="button"
          tone={mode === 'selector' ? 'selected' : 'outline'}
          aria-pressed={mode === 'selector'}
          onClick={() => setMode('selector')}
        >
          Year / Make / Model
        </StorefrontButton>
        <StorefrontButton
          type="button"
          tone={mode === 'vin' ? 'selected' : 'outline'}
          aria-pressed={mode === 'vin'}
          onClick={() => setMode('vin')}
        >
          VIN
        </StorefrontButton>
      </div>
      {mode === 'vin' ? <VinForm id="garage-vin" initialVin={vehicle?.vin ?? ''} /> : <ApplicationForm />}
    </div>
  )
}

function ApplicationForm() {
  const setVehicle = useVehicleStore((state) => state.setVehicle)
  const applications = useQuery({ queryKey: garageKeys.applications(), queryFn: listApplications })
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [applicationId, setApplicationId] = useState('')

  const rows = useMemo(() => applications.data ?? [], [applications.data])
  const years = useMemo(() => yearOptions(rows), [rows])
  const byYear = rows.filter((row) => year && row.yearFrom <= Number(year) && Number(year) <= row.yearTo)
  const makes = unique(byYear.map((row) => row.make))
  const byMake = byYear.filter((row) => row.make === make)
  const models = unique(byMake.flatMap((row) => row.models))
  const engines = byMake.filter((row) => row.models.includes(model))
  const chosen = engines.find((row) => row.id === applicationId)

  if (applications.isPending) {
    return <p className="text-sm text-muted-foreground">Loading vehicles…</p>
  }

  if (applications.isError) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-destructive">
          {applications.error instanceof ApiError
            ? applications.error.message
            : 'Could not load vehicles.'}
        </p>
        <StorefrontButton type="button" tone="outline" onClick={() => void applications.refetch()}>
          Try again
        </StorefrontButton>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!chosen) return
        setVehicle({
          source: 'selector',
          vin: '',
          year,
          make,
          model,
          engine: chosen.engine,
          engineLabel: engineLabel(chosen),
          applicationId: chosen.id,
        })
      }}
    >
      {/* Cada select acota al siguiente: cambiar uno vacía los de abajo. */}
      <SelectField
        id="garage-year"
        label="Year"
        value={year}
        options={withPlaceholder('Select year', years)}
        onChange={(event) => {
          setYear(event.target.value)
          setMake('')
          setModel('')
          setApplicationId('')
        }}
      />
      <SelectField
        id="garage-make"
        label="Make"
        value={make}
        disabled={!year}
        options={withPlaceholder('Select make', makes)}
        onChange={(event) => {
          setMake(event.target.value)
          setModel('')
          setApplicationId('')
        }}
      />
      <SelectField
        id="garage-model"
        label="Model"
        value={model}
        disabled={!make}
        options={withPlaceholder('Select model', models)}
        onChange={(event) => {
          setModel(event.target.value)
          // Con un solo motor posible no hace falta elegirlo.
          const options = byMake.filter((row) => row.models.includes(event.target.value))
          setApplicationId(options.length === 1 ? options[0].id : '')
        }}
      />
      <SelectField
        id="garage-engine"
        label="Engine"
        value={applicationId}
        disabled={!model}
        options={[
          { value: '', label: 'Select engine' },
          ...engines.map((row) => ({ value: row.id, label: engineLabel(row, true) })),
        ]}
        onChange={(event) => setApplicationId(event.target.value)}
      />
      <StorefrontButton type="submit" className="w-full" disabled={!chosen}>
        Save vehicle
      </StorefrontButton>
    </form>
  )
}

function engineLabel(row: VehicleApplication, withCode = false): string {
  const base = [`${row.engine}L`, row.engineFamily].filter(Boolean).join(' ')
  return withCode && row.engineCode ? `${base} (${row.engineCode})` : base
}

function yearOptions(rows: VehicleApplication[]): string[] {
  const years = new Set<number>()
  for (const row of rows) {
    for (let year = row.yearFrom; year <= row.yearTo; year += 1) years.add(year)
  }
  return [...years].sort((a, b) => b - a).map(String)
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

function withPlaceholder(label: string, values: string[]) {
  return [{ value: '', label }, ...values.map((value) => ({ value, label: value }))]
}
