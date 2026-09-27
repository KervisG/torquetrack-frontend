import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'

import { quoteCustomerLabel, type AdminQuote } from '../types'

export function QuotesIconGrid({ quotes }: { quotes: AdminQuote[] }) {
  if (!quotes.length) {
    return <p className="text-sm text-muted-foreground">No quotes found.</p>
  }

  return (
    <ul aria-label="Quotes" className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Link
            to={`/admin/quotes/${encodeURIComponent(quote.id)}`}
            aria-label={quote.number}
            className="flex h-full flex-col gap-3 rounded-lg border border-foreground/15 bg-background p-4 hover:border-foreground/30 hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span className="space-y-1">
              <span className="block font-medium">{quote.number}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {quoteCustomerLabel(quote.customer)}
              </span>
            </span>
            <Badge variant={quote.status === 'ACTIVE' ? 'secondary' : 'outline'} className="w-fit">
              {quote.status}
            </Badge>
            <span className="mt-auto text-sm">
              <span className="block font-medium">{formatMoney(quote.totals.total)}</span>
              <span className="block text-muted-foreground">Expires {formatDate(quote.expiresAt)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
