import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-client'

import { listAdminApplications } from '../api'
import { adminProductKeys } from '../query-keys'
import type { AdminApplication } from '../types'

function applicationLabel(app: AdminApplication): string {
  const years = app.yearFrom === app.yearTo ? `${app.yearFrom}` : `${app.yearFrom}–${app.yearTo}`
  const engine = [app.engine ? `${app.engine}L` : '', app.engineFamily].filter(Boolean).join(' ')
  const models = app.models?.length ? ` (${app.models.join(', ')})` : ''
  return `${years} ${app.make} ${engine}${models}`.replace(/\s+/g, ' ').trim()
}

type CompatibleVehiclesFieldProps = {
  value: string[]
  onChange: (value: string[]) => void
}

// La lista se pide recién al abrir el selector: editar otros campos no la
// necesita. Sin selección el backend cae al texto de marca, años y motor.
export function CompatibleVehiclesField({ value, onChange }: CompatibleVehiclesFieldProps) {
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState('')
  const applications = useQuery({
    queryKey: adminProductKeys.applications(),
    queryFn: listAdminApplications,
    enabled: picking,
  })

  const byId = useMemo(
    () => new Map((applications.data ?? []).map((app) => [app.id, app])),
    [applications.data],
  )
  const term = search.trim().toLowerCase()
  const options = (applications.data ?? []).filter(
    (app) => !term || `${applicationLabel(app)} ${app.id}`.toLowerCase().includes(term),
  )

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((code) => code !== id) : [...value, id])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="compatible-vehicles-label" className="text-sm font-medium">
          Compatible vehicles
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setPicking((open) => !open)}>
          {picking ? 'Done' : 'Choose vehicles'}
        </Button>
      </div>
      {value.length ? (
        <ul aria-labelledby="compatible-vehicles-label" className="flex flex-wrap gap-2">
          {value.map((id) => {
            const app = byId.get(id)
            const label = app ? applicationLabel(app) : id
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
              >
                {label}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${label}`}
                  onClick={() => toggle(id)}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          None selected. Fitment is checked against make, years and engine above.
        </p>
      )}
      {picking ? (
        <div className="space-y-2 rounded-md border p-3">
          <Input
            type="search"
            aria-label="Search vehicles"
            placeholder="Search by make, year, engine or model"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {applications.isPending ? (
            <p className="text-sm text-muted-foreground">Loading vehicles…</p>
          ) : applications.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {applications.error instanceof ApiError
                ? applications.error.message
                : 'Could not load vehicles.'}
            </p>
          ) : options.length ? (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {options.map((app) => (
                <li key={app.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value.includes(app.id)}
                      onChange={() => toggle(app.id)}
                    />
                    {applicationLabel(app)}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No vehicles match your search.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
