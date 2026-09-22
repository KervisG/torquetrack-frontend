export const dashboardKeys = {
  all: ['admin-dashboard'] as const,
  counts: () => [...dashboardKeys.all, 'counts'] as const,
}
