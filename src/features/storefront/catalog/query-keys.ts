import type { ProductSearch } from './api'

export const catalogKeys = {
  all: ['catalog'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  search: (search: ProductSearch) => [...catalogKeys.products(), 'search', search] as const,
  byIds: (ids: string[]) => [...catalogKeys.products(), 'ids', ids] as const,
  overview: () => [...catalogKeys.products(), 'overview'] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
}
