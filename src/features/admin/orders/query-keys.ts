export const adminOrderKeys = {
  all: ['admin-orders'] as const,
  list: () => [...adminOrderKeys.all, 'list'] as const,
  listByDate: (date: string) => [...adminOrderKeys.list(), { date }] as const,
}
