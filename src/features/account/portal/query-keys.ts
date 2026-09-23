export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  orders: () => [...accountKeys.all, 'orders'] as const,
  quotes: () => [...accountKeys.all, 'quotes'] as const,
}
