import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { listQuotes } from '../api'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'
import type { SaveChange } from './quote-inline-edit'

// The VIN check travels as a $0 line so the customer reads it on the quote,
// the public page and the PDF: it records who confirmed the fitment.
export const VIN_CHECK_PART = 'VIN-CHECK'
const VERIFIER = /Verified by ([A-Z]{1,4}) #(\S+)$/
const NEW = '__new__'

export function vinCheckTitle(vin: string, verifier: string): string {
  return `All parts on this quote were verified against VIN ${vin} · Verified by ${verifier}`
}

// Verifiers already used on other quotes, so the dropdown offers them again.
function useKnownVerifiers(): string[] {
  const quotes = useQuery({ queryKey: adminQuoteKeys.list(), queryFn: listQuotes })
  const found = new Set<string>()
  for (const quote of quotes.data ?? []) {
    for (const item of quote.items) {
      const match = item.partNumber === VIN_CHECK_PART ? VERIFIER.exec(item.title) : null
      if (match) found.add(`${match[1]} #${match[2]}`)
    }
  }
  return [...found].sort()
}

export function VinCheckButton({ quote, saveChange }: { quote: AdminQuote; saveChange: SaveChange }) {
  const known = useKnownVerifiers()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [initials, setInitials] = useState('')
  const [employee, setEmployee] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const vin = quote.vehicle.vin.trim().toUpperCase()
  const existing = quote.items.some((item) => item.partNumber === VIN_CHECK_PART)
  const selected = choice || (known.length ? known[0] : NEW)

  const verifier = (): string | null => {
    if (selected !== NEW) return selected
    const letters = initials.trim().toUpperCase()
    const number = employee.trim()
    if (!/^[A-Z]{1,4}$/.test(letters)) return null
    if (!/^[A-Za-z0-9-]{1,10}$/.test(number)) return null
    return `${letters} #${number}`
  }

  const submit = async () => {
    if (!vin) return setError('Add the vehicle VIN first')
    const by = verifier()
    if (!by) return setError('Enter initials (letters) and an employee number')
    const line = {
      title: vinCheckTitle(vin, by),
      partNumber: VIN_CHECK_PART,
      quantity: 1,
      unitPrice: 0,
      coreCharge: 0,
    }
    setSaving(true)
    const message = await saveChange((values) => ({
      ...values,
      items: [...values.items.filter((item) => item.partNumber !== VIN_CHECK_PART), line],
    }))
    setSaving(false)
    setError(message)
    if (!message) setOpen(false)
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <ShieldCheck className="size-4" aria-hidden="true" />
        {existing ? 'Change VIN check' : 'Add VIN check'}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <span className="text-muted-foreground">Verified by</span>
      <select
        aria-label="Verified by"
        value={selected}
        onChange={(event) => setChoice(event.target.value)}
        className="h-8 rounded-md border bg-background px-2"
      >
        {known.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={NEW}>+ New employee</option>
      </select>
      {selected === NEW ? (
        <>
          <Input
            aria-label="Initials"
            placeholder="Initials"
            value={initials}
            onChange={(event) => setInitials(event.target.value)}
            className="h-8 w-24"
          />
          <Input
            aria-label="Employee number"
            placeholder="Employee #"
            value={employee}
            onChange={(event) => setEmployee(event.target.value)}
            className="h-8 w-28"
          />
        </>
      ) : null}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? 'Saving…' : 'Add to quote'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error ? <p className="basis-full text-xs text-destructive">{error}</p> : null}
    </form>
  )
}
