import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { listQuotes } from '../api'
import { QuoteForm } from '../components/quote-form'
import { useSaveQuote } from '../hooks/use-save-quote'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

const newQuote: AdminQuoteValues = {
  status: 'ACTIVE',
  customer: { name: '', company: '', email: '', phone: '' },
  vehicle: { year: '', make: '', model: '', engine: '', vin: '' },
  items: [],
  shipping: 0,
  shippingAddress: { address1: '', city: '', state: '', zip: '' },
  tax: 0,
  taxOverride: { enabled: false, reason: '' },
  memo: '',
}

// Un override guardado se vuelve a mostrar solo a quien puede fijarlo; sin el
// permiso el guardado recalcula el impuesto.
function valuesFor(quote: AdminQuote, canOverrideTax: boolean): AdminQuoteValues {
  const overriding = canOverrideTax && quote.taxSource === 'manual'
  return {
    status: quote.status,
    customer: { ...quote.customer },
    vehicle: { ...quote.vehicle },
    items: quote.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      partNumber: item.partNumber,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      coreCharge: item.coreCharge,
    })),
    shipping: quote.shipping,
    shippingAddress: { ...quote.shippingAddress },
    tax: quote.tax,
    taxOverride: { enabled: overriding, reason: overriding ? quote.taxOverrideReason : '' },
    memo: quote.memo,
  }
}

// `/admin/quotes/new` y `/admin/quotes/:id/edit`. Alta y edición van por
// `POST /api/admin/quotes/`, que exige `quotes.create` en los dos casos.
export function QuoteEditorPage() {
  const { id } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('quotes.create')
  const canOverrideTax = can('tax_exemptions.review')
  const navigate = useNavigate()
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed && Boolean(id),
  })
  const existing = id ? quotes.data?.find((row) => row.id === id) : undefined

  const save = useSaveQuote(existing, (result) => {
    navigate(`/admin/quotes/${encodeURIComponent(result.quote.id)}`)
  })

  if (!allowed) {
    return (
      <PermissionNotice
        title="Quote"
        message="You do not have permission to create or edit quotes."
      />
    )
  }

  const title = id ? `Edit quote ${existing?.number ?? ''}`.trim() : 'New quote'
  const back = id
    ? { to: `/admin/quotes/${encodeURIComponent(id)}`, label: 'Back to quote' }
    : { to: '/admin/quotes', label: 'All quotes' }

  let body
  if (id && quotes.isPending) {
    body = <p className="text-sm text-muted-foreground">Loading quote…</p>
  } else if (id && quotes.error) {
    body = <FormError error={quotes.error} />
  } else if (id && !existing) {
    body = <p className="text-sm text-muted-foreground">Quote not found.</p>
  } else {
    body = (
      <QuoteForm
        key={existing?.id ?? 'new'}
        defaultValues={existing ? valuesFor(existing, canOverrideTax) : newQuote}
        quoteId={existing?.id}
        customerId={existing?.customerId ?? undefined}
        canOverrideTax={canOverrideTax}
        savedTax={
          existing
            ? {
                amount: existing.tax,
                source: existing.taxSource,
                description: existing.taxDescription,
              }
            : undefined
        }
        canSearchCatalog={can('products.view')}
        submitting={save.isPending}
        error={save.error}
        onSubmit={(values) => save.mutate(values)}
      />
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader title={title} back={back} />
      <Card>
        <CardContent className="pt-6">{body}</CardContent>
      </Card>
    </section>
  )
}
