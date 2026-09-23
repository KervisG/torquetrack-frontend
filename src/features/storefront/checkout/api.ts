import { apiRequest } from '@/lib/api-client'
import type { VinVehicle } from '@/features/storefront/catalog/types'

import type {
  CheckoutCustomer,
  CheckoutResponse,
  FitmentResponse,
  ShippingRate,
  ShippingRatesResponse,
  ShippingSelection,
  TaxEstimate,
} from './types'

// El paquete (peso y medidas) lo arma el backend desde el catálogo; un peso
// mandado por el navegador cotizaría un envío más barato.
export function getShippingRates(payload: {
  to: Record<string, string>
  items: Array<{ id: string; qty: number }>
}): Promise<ShippingRatesResponse> {
  return apiRequest<ShippingRatesResponse>('/shipping/rates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function estimateTax(payload: {
  amount: number
  core: number
  shipping: number
  subtotal: number
  state: string
  zip: string
  city: string
  address1: string
}): Promise<TaxEstimate> {
  return apiRequest<TaxEstimate>('/tax/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
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

export function toShippingSelection(rate: ShippingRate | null): ShippingSelection | null {
  if (!rate?.id || !rate.shipmentId) return null
  return { shipmentId: rate.shipmentId, rateId: rate.id }
}

export function createCheckout(payload: {
  items: Array<{ id: string; qty: number }>
  cartId: string
  shipping: ShippingSelection
  vehicle: VinVehicle
  customer: CheckoutCustomer
}): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
