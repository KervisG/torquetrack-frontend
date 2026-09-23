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
    <div className="overflow-x-auto">
      <table aria-label="Quotes" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Number</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 text-right font-medium">Total</th>
            <th className="py-2 pr-4 font-medium">Created</th>
            <th className="py-2 font-medium">Expires</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <Link
                  to={`/admin/quotes/${encodeURIComponent(quote.id)}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {quote.number}
                </Link>
              </td>
              <td className="py-2 pr-4">{quoteCustomerLabel(quote.customer)}</td>
              <td className="py-2 pr-4">
                <Badge variant={quote.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                  {quote.status}
                </Badge>
              </td>
              <td className="py-2 pr-4 text-right">{formatMoney(quote.totals.total)}</td>
              <td className="py-2 pr-4">{formatDate(quote.createdAt)}</td>
              <td className="py-2">{formatDate(quote.expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
