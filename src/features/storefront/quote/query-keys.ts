export const publicQuoteKeys = {
  all: ['public-quote'] as const,
  token: (token: string) => [...publicQuoteKeys.all, token] as const,
}
