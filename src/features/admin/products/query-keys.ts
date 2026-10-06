export const adminProductKeys = {
  all: ['admin-products'] as const,
  list: () => [...adminProductKeys.all, 'list'] as const,
  applications: () => [...adminProductKeys.all, 'applications'] as const,
}
