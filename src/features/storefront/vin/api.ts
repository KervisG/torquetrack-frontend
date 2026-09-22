import { apiRequest } from '@/lib/api-client'
import type { VinVehicle } from '@/features/storefront/catalog/types'

export function decodeVin(vin: string): Promise<{ vehicle: VinVehicle }> {
  return apiRequest<{ vehicle: VinVehicle }>(`/vin/decode?vin=${encodeURIComponent(vin)}`)
}
