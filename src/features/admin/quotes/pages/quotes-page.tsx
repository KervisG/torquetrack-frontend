import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listQuotes } from '../api'
import { QuoteEditorDialog } from '../components/quote-editor-dialog'
import { QuotesTable } from '../components/quotes-table'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
] as const

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
  const [creating, setCreating] = useState(false)
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed,
  })

  const rows = [...(quotes.data ?? [])].reverse().filter((quote) => matches(quote, search, status))
  const paged = usePagedRows(rows, `${search}|${status}`)

  if (!allowed) {
    return <PermissionNotice title="Quotes" message="You do not have permission to view quotes." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Quotes prepared for customers, newest first."
        actions={
          can('quotes.create') ? (
            <Button type="button" onClick={() => setCreating(true)}>
              New quote
            </Button>
          ) : null
        }
      />
      {can('quotes.create') ? (
        <QuoteEditorDialog open={creating} onOpenChange={setCreating} />
      ) : null}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                type="button"
                role="tab"
                size="sm"
                variant={status === tab.value ? 'default' : 'outline'}
                aria-selected={status === tab.value}
                onClick={() => setParams(tab.value === 'ALL' ? {} : { status: tab.value }, { replace: true })}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <FormField
            id="quote-search"
            label="Search quotes"
            placeholder="Number, customer, VIN or part"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {quotes.isPending ? (
            <p className="text-sm text-muted-foreground">Loading quotes…</p>
          ) : quotes.error ? (
            <FormError error={quotes.error} />
          ) : (
            <>
              <QuotesTable quotes={paged.items} />
              <ListPagination
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                from={paged.from}
                to={paged.to}
                onPage={paged.setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
