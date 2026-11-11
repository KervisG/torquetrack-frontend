import { apiRequest } from '@/lib/api-client'
import type { VinVehicle } from '@/features/storefront/catalog/types'

// `missingFields`: campos de `vehicle` que el VIN no trajo (la API no los
// completa). `warnings`: códigos de aviso; `check_digit` = VIN mal tipeado.
export type VinDecodeResult = {
  vehicle: VinVehicle & { engineModel?: string; fuelType?: string }
  missingFields?: VinVehicleField[]
  warnings?: string[]
}

export type VinVehicleField = 'year' | 'make' | 'model' | 'engine'

export function decodeVin(vin: string): Promise<VinDecodeResult> {
  return apiRequest<VinDecodeResult>(`/vin/decode?vin=${encodeURIComponent(vin)}`)
}
