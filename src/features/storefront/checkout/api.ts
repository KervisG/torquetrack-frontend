import { apiRequest } from '@/lib/api-client'
import type { VinVehicle } from '@/features/storefront/catalog/types'

import type {
  CheckoutCustomer,
  CheckoutResponse,
  FitmentResponse,
  ShippingRate,
  ShippingRatesResponse,
  TaxEstimate,
} from './types'

export function getShippingRates(payload: {
  to: Record<string, string>
  parcel: { weight: number; length: number; width: number; height: number }
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

export function createCheckout(payload: {
  items: Array<{ id: string; qty: number }>
  cartId: string
  shipping: ShippingRate
  vehicle: VinVehicle
  customer: CheckoutCustomer
}): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
