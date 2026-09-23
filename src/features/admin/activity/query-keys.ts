export const activityKeys = {
  all: ['admin-activity'] as const,
  list: () => [...activityKeys.all, 'list'] as const,
}
