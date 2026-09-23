import type { LineItem } from '@/components/line-items-table'
import type { DocumentTotals } from '@/features/account/portal/types'

export type QuoteRequestResponse = {
  ok: true
  quoteId: string
  quoteNumber: string
  // Si salieron los correos; sin proveedor configurado los dos son `false`.
  email: { staff: boolean; customer: boolean }
}

// `GET /api/quote/public/<token>/details/`: solo lo que ve el cliente, con el
// total de cada línea ya calculado por el backend.
export type PublicQuote = {
  number: string
  status: string
  createdAt: Date
  expiresAt: Date | null
  customer: { name: string; company: string }
  vehicle: { year?: string | number; make?: string; model?: string; engine?: string; vin?: string }
  items: Array<LineItem & { lineTotal: number }>
  totals: DocumentTotals
}
