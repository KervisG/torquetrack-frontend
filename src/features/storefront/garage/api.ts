import { apiRequest } from '@/lib/api-client'

import type { VehicleApplication } from './types'

export function listApplications(): Promise<VehicleApplication[]> {
  return apiRequest<VehicleApplication[]>('/applications')
}
