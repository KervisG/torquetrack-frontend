import { useQuery } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'

import { listAccountQuotes } from '../api'
import { formatDate } from '@/lib/format-date'
import { accountKeys } from '../query-keys'
import { DocumentsTable } from './documents-table'

export function QuotesPanel() {
  const quotes = useQuery({ queryKey: accountKeys.quotes(), queryFn: listAccountQuotes })

  if (quotes.isPending) return <p className="text-sm text-muted-foreground">Loading quotes…</p>
  if (quotes.error) return <FormError error={quotes.error} />

  return (
    <DocumentsTable
      label="Quotes"
      numberLabel="Quote"
      extraLabel="Expires"
      emptyMessage="No quotes yet."
      rows={quotes.data.map((quote) => ({
        id: quote.id,
        number: quote.number,
        status: quote.status,
        createdAt: quote.createdAt,
        total: quote.totals.total,
        extra: formatDate(quote.expiresAt),
      }))}
    />
  )
}
