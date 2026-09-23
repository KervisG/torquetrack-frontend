import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listQuotes } from '../api'
import { QuotesTable } from '../components/quotes-table'
import { adminQuoteKeys } from '../query-keys'
import { QUOTE_STATUSES, type AdminQuote } from '../types'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  ...QUOTE_STATUSES.map((status) => ({ value: status, label: status })),
]

// La API no filtra: el listado completo se filtra en el cliente.
function matches(quote: AdminQuote, search: string, status: string): boolean {
  if (status !== 'ALL' && quote.status !== status) return false
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [
    quote.number,
    quote.customer.name,
    quote.customer.company,
    quote.customer.email,
    quote.vehicle.vin,
    ...quote.items.map((item) => item.partNumber),
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

export function QuotesPage() {
  const { can } = useAdminPermissions()
  const allowed = can('quotes.view')
  // `?status=` viene de los enlaces del dashboard.
  const [params, setParams] = useSearchParams()
  const status = params.get('status')?.toUpperCase() || 'ALL'
  const [search, setSearch] = useState('')
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed,
  })

  if (!allowed) {
    return <PermissionNotice title="Quotes" message="You do not have permission to view quotes." />
  }

  // La API devuelve de más vieja a más nueva; el panel muestra primero lo último.
  const rows = [...(quotes.data ?? [])].reverse().filter((quote) => matches(quote, search, status))

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Quotes</h1>
        {can('quotes.create') ? (
          <Button asChild>
            <Link to="/admin/quotes/new">New quote</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="quote-search"
              label="Search quotes"
              placeholder="Number, customer, VIN or part"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SelectField
              id="quote-status-filter"
              label="Status"
              options={STATUS_FILTERS}
              value={status}
              onChange={(event) => {
                const next = event.target.value
                setParams(next === 'ALL' ? {} : { status: next }, { replace: true })
              }}
            />
          </div>
          {quotes.isPending ? (
            <p className="text-sm text-muted-foreground">Loading quotes…</p>
          ) : quotes.error ? (
            <FormError error={quotes.error} />
          ) : (
            <QuotesTable quotes={rows} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
