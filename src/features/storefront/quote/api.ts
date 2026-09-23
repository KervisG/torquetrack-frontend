import { apiRequest } from '@/lib/api-client'

import type { PublicQuote, QuoteRequestResponse } from './types'

// Solo viajan producto y cantidad: el backend toma precio y core de la base.
// Con sesión de cliente el email lo fija la cuenta, no el body.
export function requestQuote(payload: {
  customer: { name: string; email: string; phone: string }
  items: Array<{ productId: string; quantity: number }>
  cartId: string
}): Promise<QuoteRequestResponse> {
  return apiRequest<QuoteRequestResponse>('/quote/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

type RawPublicQuote = Omit<PublicQuote, 'createdAt' | 'expiresAt'> & {
  createdAt: string
  expiresAt: string | null
}

// 404 si el token no existe y 410 si la cotización venció.
export async function getPublicQuote(token: string): Promise<PublicQuote> {
  const body = await apiRequest<RawPublicQuote>(
    `/quote/public/${encodeURIComponent(token)}/details`,
  )
  return {
    ...body,
    createdAt: new Date(body.createdAt),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  }
}

// Sin Stripe configurado responde 502 con el motivo.
export function checkoutPublicQuote(
  token: string,
): Promise<{ ok: true; url: string; orderNumber: string }> {
  return apiRequest<{ ok: true; url: string; orderNumber: string }>(
    `/quote/public/${encodeURIComponent(token)}/checkout`,
    { method: 'POST' },
  )
}
