export const adminQuoteKeys = {
  all: ['admin-quotes'] as const,
  list: () => [...adminQuoteKeys.all, 'list'] as const,
}
