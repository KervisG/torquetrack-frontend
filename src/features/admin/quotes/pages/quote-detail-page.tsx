import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { LineItemsTable } from '@/components/line-items-table'
import { TotalsSummary } from '@/components/totals-summary'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { formatDate } from '@/lib/format-date'

import { listQuotes } from '../api'
import { QuoteActions } from '../components/quote-actions'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

// La API no tiene un GET por id: el detalle sale del listado (y de su cache).
export function QuoteDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('quotes.view')
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed,
  })

  if (!allowed) {
    return <PermissionNotice title="Quote" message="You do not have permission to view quotes." />
  }

  const back = { to: '/admin/quotes', label: 'All quotes' }

  if (quotes.isPending) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <p className="text-sm text-muted-foreground">Loading quote…</p>
      </section>
    )
  }
  if (quotes.error) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <FormError error={quotes.error} />
      </section>
    )
  }

  const quote = quotes.data.find((row) => row.id === id)
  if (!quote) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <p className="text-sm text-muted-foreground">Quote not found.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Quote ${quote.number}`}
        back={back}
        meta={<Badge variant="outline">{quote.status}</Badge>}
        description={
          <>
            Created {formatDate(quote.createdAt)} · Expires {formatDate(quote.expiresAt)}
            {quote.createdBy ? ` · By ${quote.createdBy}` : ''}
            {quote.orderNumber ? ` · Order ${quote.orderNumber}` : ''}
          </>
        }
      />
      <Section title="Actions">
        <QuoteActions quote={quote} can={can} />
      </Section>
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Customer">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Name" value={quote.customer.name} />
            <Detail label="Company" value={quote.customer.company} />
            <Detail label="Email" value={quote.customer.email} />
            <Detail label="Phone" value={quote.customer.phone} />
          </dl>
        </Section>
        <Section title="Vehicle & notes">
          <dl className="space-y-3 text-sm">
            <Detail label="Vehicle" value={vehicleLabel(quote)} />
            <Detail label="Memo" value={quote.memo} />
            <Detail
              label="Last emailed"
              value={
                quote.lastEmailedAt
                  ? `${formatDate(quote.lastEmailedAt)} to ${quote.lastEmailedTo}`
                  : ''
              }
            />
          </dl>
        </Section>
      </div>
      <Section title="Items">
        <LineItemsTable items={quote.items} />
        <div className="ml-auto mt-4 max-w-xs">
          <TotalsSummary totals={quote.totals} />
        </div>
      </Section>
    </section>
  )
}

function vehicleLabel(quote: AdminQuote): string {
  const { year, make, model, engine, vin } = quote.vehicle
  const name = [year, make, model, engine].filter(Boolean).join(' ')
  return [name, vin ? `VIN ${vin}` : ''].filter(Boolean).join(' · ')
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
