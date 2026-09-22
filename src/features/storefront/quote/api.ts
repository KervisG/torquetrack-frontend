import { apiRequest } from '@/lib/api-client'

export type QuoteRequestResponse = {
  ok: true
  quoteId: string
  quoteNumber: string
}

export function requestQuote(payload: {
  customer: { name: string; email: string; phone: string }
  items: Array<{
    productId: string
    title?: string
    partNumber: string
    quantity: number
    unitPrice: number
    coreCharge: number
  }>
}): Promise<QuoteRequestResponse> {
  return apiRequest<QuoteRequestResponse>('/quote/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
