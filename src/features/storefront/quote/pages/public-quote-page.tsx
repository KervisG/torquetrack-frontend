import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { StorefrontButton } from '@/components/storefront-button'
import { TotalsSummary } from '@/components/totals-summary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api-client'
import { formatDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'

import { checkoutPublicQuote, getPublicQuote } from '../api'
import { publicQuoteKeys } from '../query-keys'
import type { PublicQuote } from '../types'

// Estados en los que pagar ya no corresponde: una cotización convertida tiene
// su pedido y una perdida quedó cerrada por ventas.
const CLOSED_STATUSES = new Set(['CONVERTED', 'LOST', 'EXPIRED'])

export function PublicQuotePage() {
  const { token = '' } = useParams()
  const quote = useQuery({
    queryKey: publicQuoteKeys.token(token),
    queryFn: () => getPublicQuote(token),
    // Un 404/410 no mejora reintentando.
    retry: false,
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {quote.isPending ? (
        <p className="text-muted-foreground">Loading quote…</p>
      ) : quote.error ? (
        <QuoteUnavailable error={quote.error} />
      ) : (
        <QuoteView quote={quote.data} token={token} />
      )}
    </main>
  )
}

function QuoteUnavailable({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : 0
  const title =
    status === 410
      ? 'This quote has expired'
      : status === 404
        ? 'Quote link not found'
        : 'We could not load this quote'
  const message =
    status === 410
      ? 'Quotes are valid for 30 days. Contact TorqueTrack to reopen it with current pricing.'
      : status === 404
        ? 'Check that you opened the full link from your email, or contact TorqueTrack for a new one.'
        : 'Try again in a moment.'

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{message}</p>
        <StorefrontButton asChild tone="outline">
          <Link to="/">Go to the store</Link>
        </StorefrontButton>
      </CardContent>
    </Card>
  )
}

function QuoteView({ quote, token }: { quote: PublicQuote; token: string }) {
  const checkout = useMutation({
    mutationFn: () => checkoutPublicQuote(token),
    onSuccess: (result) => window.location.assign(result.url),
  })
  const customer = [quote.customer.name, quote.customer.company].filter(Boolean).join(' · ')
  const vehicle = [quote.vehicle.year, quote.vehicle.make, quote.vehicle.model, quote.vehicle.engine]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Quote {quote.number}</h1>
        <Badge variant="outline">{quote.status}</Badge>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {customer ? <p>Prepared for {customer}</p> : null}
        {vehicle || quote.vehicle.vin ? (
          <p>
            {vehicle}
            {quote.vehicle.vin ? ` · VIN ${quote.vehicle.vin}` : ''}
          </p>
        ) : null}
        <p>
          Issued {formatDate(quote.createdAt)}
          {quote.expiresAt ? ` · Valid until ${formatDate(quote.expiresAt)}` : ''}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table aria-label="Quote items" className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Part #</th>
                  <th className="py-2 pr-4 text-right font-medium">Qty</th>
                  <th className="py-2 pr-4 text-right font-medium">Unit price</th>
                  <th className="py-2 pr-4 text-right font-medium">Core</th>
                  <th className="py-2 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={`${item.partNumber}-${index}`} className="border-b last:border-0">
                    <td className="py-2 pr-4">{item.title || '—'}</td>
                    <td className="py-2 pr-4">{item.partNumber || '—'}</td>
                    <td className="py-2 pr-4 text-right">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right">{formatMoney(item.unitPrice)}</td>
                    <td className="py-2 pr-4 text-right">{formatMoney(item.coreCharge)}</td>
                    <td className="py-2 text-right">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-auto max-w-xs">
            <TotalsSummary totals={quote.totals} />
          </div>
          <p className="text-xs text-muted-foreground">
            Core charges are refunded when the old unit is received and inspected. Prices and
            availability may change until the order is paid.
          </p>
        </CardContent>
      </Card>

      {CLOSED_STATUSES.has(quote.status) ? null : (
        <div className="space-y-3">
          <StorefrontButton
            type="button"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? 'Opening secure checkout…' : 'Checkout securely'}
          </StorefrontButton>
          <FormError error={checkout.error} />
        </div>
      )}
    </div>
  )
}
