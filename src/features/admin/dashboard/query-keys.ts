import type { AnalyticsRange } from './types'

export const dashboardKeys = {
  all: ['admin-dashboard'] as const,
  counts: () => [...dashboardKeys.all, 'counts'] as const,
  analytics: (range: AnalyticsRange) => [...dashboardKeys.all, 'analytics', range] as const,
}
