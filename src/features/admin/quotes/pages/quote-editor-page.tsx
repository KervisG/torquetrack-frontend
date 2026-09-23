import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { saveCustomer } from '@/features/admin/customers/api'
import { adminCustomerKeys } from '@/features/admin/customers/query-keys'
import { dashboardKeys } from '@/features/admin/dashboard/query-keys'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { listQuotes, saveQuote } from '../api'
import { QuoteForm } from '../components/quote-form'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

const newQuote: AdminQuoteValues = {
  status: 'ACTIVE',
  customer: { name: '', company: '', email: '', phone: '' },
  vehicle: { year: '', make: '', model: '', engine: '', vin: '' },
  items: [],
  shipping: 0,
  tax: 0,
  memo: '',
}

function valuesFor(quote: AdminQuote): AdminQuoteValues {
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
    tax: quote.tax,
    memo: quote.memo,
  }
}

// `/admin/quotes/new` y `/admin/quotes/:id/edit`. Alta y edición van por
// `POST /api/admin/quotes/`, que exige `quotes.create` en los dos casos.
export function QuoteEditorPage() {
  const { id } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('quotes.create')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed && Boolean(id),
  })
  const existing = id ? quotes.data?.find((row) => row.id === id) : undefined

  const save = useMutation({
    mutationFn: async (values: AdminQuoteValues) => {
      let customerId = existing?.customerId ?? null
      // Con `customers.edit` el cliente queda como perfil (y aparece en su
      // portal); sin él la cotización guarda solo el snapshot.
      if (can('customers.edit')) {
        const customer = await saveCustomer({ id: customerId, ...values.customer })
        customerId = customer.id
      }
      return saveQuote({ ...values, id: existing?.id ?? null, customerId })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQuoteKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ])
      navigate(`/admin/quotes/${encodeURIComponent(result.quote.id)}`)
    },
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
  const back = (
    <Link
      to={id ? `/admin/quotes/${encodeURIComponent(id)}` : '/admin/quotes'}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      ← Back
    </Link>
  )

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
        defaultValues={existing ? valuesFor(existing) : newQuote}
        submitting={save.isPending}
        error={save.error}
        onSubmit={(values) => save.mutate(values)}
      />
    )
  }

  return (
    <section className="space-y-6">
      {back}
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="pt-6">{body}</CardContent>
      </Card>
    </section>
  )
}
