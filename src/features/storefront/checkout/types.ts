import type { ShippingRate, VinVehicle } from '@/features/storefront/catalog/types'

export type { ShippingRate, VinVehicle }

// Lo único que el checkout manda del envío: el backend busca el monto que
// cotizó para ese shipment y esa tarifa.
export type ShippingSelection = {
  shipmentId: string
  rateId: string
}

export type ShippingRatesResponse = {
  configured: boolean
  message?: string
  ground?: ShippingRate | null
  secondDay?: ShippingRate | null
  overnight?: ShippingRate | null
}

export type TaxEstimate = {
  tax: number
  rate?: number
  source?: string
  label?: string
}

export type FitmentResult = {
  id: string
  title?: string
  partNumber?: string
  compatible: boolean
  reasons?: string[]
  warnings?: string[]
}

export type FitmentResponse = {
  compatible: boolean
  results: FitmentResult[]
}

export type CheckoutResponse = {
  ok: true
  url: string
  orderId: string
  orderNumber: string
  tax: number
}

export type CheckoutCustomer = {
  name: string
  company?: string
  email: string
  phone?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
}
