export const adminSessionKeys = {
  all: ['admin-session'] as const,
  current: () => [...adminSessionKeys.all, 'current'] as const,
}
