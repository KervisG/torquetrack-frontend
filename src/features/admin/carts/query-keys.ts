export const adminCartKeys = {
  all: ['admin-carts'] as const,
  list: () => [...adminCartKeys.all, 'list'] as const,
}
