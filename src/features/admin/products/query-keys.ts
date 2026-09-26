export const adminProductKeys = {
  all: ['admin-products'] as const,
  list: () => [...adminProductKeys.all, 'list'] as const,
}
