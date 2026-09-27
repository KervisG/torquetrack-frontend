import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'

import { quoteCustomerLabel, type AdminQuote } from '../types'

export function QuotesTable({ quotes }: { quotes: AdminQuote[] }) {
  if (!quotes.length) {
    return <p className="text-sm text-muted-foreground">No quotes found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
      <table aria-label="Quotes" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Number</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Expires</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            // El enlace cubre la fila: el número sigue siendo el nombre accesible.
            <tr key={quote.id} className="group relative border-b border-border/60 last:border-0 hover:bg-muted/50">
              <td className="px-4 py-4">
                <Link
                  to={`/admin/quotes/${encodeURIComponent(quote.id)}`}
                  className="font-medium after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {quote.number}
                </Link>
              </td>
              <td className="px-4 py-4">{quoteCustomerLabel(quote.customer)}</td>
              <td className="px-4 py-4">
                <Badge variant={quote.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                  {quote.status}
                </Badge>
              </td>
              <td className="px-4 py-4 text-right">{formatMoney(quote.totals.total)}</td>
              <td className="px-4 py-4">{formatDate(quote.createdAt)}</td>
              <td className="px-4 py-4">{formatDate(quote.expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
