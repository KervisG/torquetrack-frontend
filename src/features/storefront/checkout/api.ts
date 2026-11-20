import { apiRequest } from '@/lib/api-client'
import type { VinVehicle } from '@/features/storefront/catalog/types'

import type {
  CheckoutCustomer,
  CheckoutResponse,
  FitmentResponse,
  TaxEstimate,
} from './types'

export function estimateTax(
  payload: {
    amount: number
    core: number
    shipping: number
    subtotal: number
    state: string
    zip: string
    city: string
    address1: string
  },
  signal?: AbortSignal,
): Promise<TaxEstimate> {
  return apiRequest<TaxEstimate>('/tax/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  })
}

export function checkFitment(payload: {
  vehicle: VinVehicle
  items: Array<{ id: string }>
}): Promise<FitmentResponse> {
  return apiRequest<FitmentResponse>('/fitment/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createCheckout(payload: {
  items: Array<{ id: string; qty: number }>
  // Opcional: sin VIN el pedido se crea sin vehículo y sin chequeo de fitment.
  vehicle?: VinVehicle
  customer: CheckoutCustomer
}): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
