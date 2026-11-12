import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

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
import { VehicleDetailsCard } from '../components/vehicle-details-card'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote, QuoteTaxSource } from '../types'

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
    <section className="space-y-4">
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
      <Card className="p-4">
        <QuoteActions quote={quote} can={can} />
      </Card>
      {/* Las líneas ocupan el ancho principal; el contexto va en la columna lateral. */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Section title="Items" className="lg:col-span-2">
          <LineItemsTable items={quote.items} />
          <div className="ml-auto mt-4 max-w-xs">
            <TotalsSummary totals={quote.totals} />
          </div>
        </Section>
        <div className="space-y-4">
          <CustomerSection quote={quote} />
          <VehicleSection quote={quote} />
          <ShippingSection quote={quote} />
          <NotesSection quote={quote} />
        </div>
      </div>
    </section>
  )
}

// Sin `customerId` la cotización solo guarda el snapshot de contacto: se
// muestra como contacto de la cotización, distinto de una cuenta de cliente.
function CustomerSection({ quote }: { quote: AdminQuote }) {
  const { name, company, email, phone } = quote.customer
  const linked = Boolean(quote.customerId)
  const tax = taxLabel(quote.taxSource, quote.taxDescription)

  return (
    <Section
      title={linked ? 'Customer' : 'Quote contact'}
      badge={
        <Badge variant={linked ? 'default' : 'secondary'}>
          {linked ? 'Account' : 'No account'}
        </Badge>
      }
    >
      {linked ? null : (
        <p className="mb-3 text-xs text-muted-foreground">
          Saved on this quote only. No customer account was created.
        </p>
      )}
      <dl className="space-y-2 text-sm">
        <Detail label="Name" value={name} />
        <Detail label="Company" value={company} />
        <Detail label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
        <Detail label="Phone" value={phone} href={phone ? `tel:${phone}` : undefined} />
        <Detail label="Tax" value={tax} />
      </dl>
      {linked && quote.customerId ? (
        <Link
          to={`/admin/customers/${encodeURIComponent(quote.customerId)}`}
          className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          View customer
        </Link>
      ) : null}
    </Section>
  )
}

function VehicleSection({ quote }: { quote: AdminQuote }) {
  const label = vehicleLabel(quote)
  if (!label) return null
  return (
    <Section title="Vehicle">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3">
        <VehicleDetailsCard vehicle={quote.vehicle} showHeadline={false} />
      </div>
    </Section>
  )
}

function ShippingSection({ quote }: { quote: AdminQuote }) {
  const { address1, city, state, zip } = quote.shippingAddress
  const cityLine = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  if (!address1 && !cityLine) return null
  return (
    <Section title="Ship to">
      <address className="text-sm font-medium not-italic">
        {address1 ? <div>{address1}</div> : null}
        {cityLine ? <div>{cityLine}</div> : null}
      </address>
    </Section>
  )
}

function NotesSection({ quote }: { quote: AdminQuote }) {
  const emailed = quote.lastEmailedAt
    ? `${formatDate(quote.lastEmailedAt)} to ${quote.lastEmailedTo}`
    : ''
  if (!quote.memo && !emailed) return null
  return (
    <Section title="Notes">
      <dl className="space-y-2 text-sm">
        <Detail label="Memo" value={quote.memo} />
        <Detail label="Last emailed" value={emailed} />
      </dl>
    </Section>
  )
}

function taxLabel(source: QuoteTaxSource, description: string): string {
  const labels: Record<QuoteTaxSource, string> = {
    calculated: 'Calculated',
    exempt: 'Exempt',
    manual: 'Manual override',
    '': '',
  }
  return [labels[source], description].filter(Boolean).join(' · ')
}

function vehicleLabel(quote: AdminQuote): string {
  const { year, make, model, engine, vin } = quote.vehicle
  const name = [year, make, model, engine].filter(Boolean).join(' ')
  return [name, vin ? `VIN ${vin}` : ''].filter(Boolean).join(' · ')
}

function Section({
  title,
  badge,
  className,
  children,
}: {
  title: string
  badge?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {badge}
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  )
}

// Solo se muestran los datos que se llenaron: un campo vacío no ocupa espacio.
function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">
        {href ? (
          <a href={href} className="underline-offset-4 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
