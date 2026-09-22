export const catalogKeys = {
  all: ['catalog'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
}
