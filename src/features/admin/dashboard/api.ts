import { apiRequest } from '@/lib/api-client'

import type { AnalyticsRange, DashboardAnalytics, DashboardResponse } from './types'

export function getDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>('/admin/dashboard')
}

export function getDashboardAnalytics(range: AnalyticsRange): Promise<DashboardAnalytics> {
  return apiRequest<DashboardAnalytics>(`/admin/dashboard/analytics?range=${range}`)
}
