import { ApiError, apiRequest } from '@/lib/api-client'

import type { Product } from './types'

export function listProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products')
}

// El backend busca primero por id y después por slug. Un 404 es "no existe",
// no un error de la página.
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  try {
    return await apiRequest<Product>(`/products/${encodeURIComponent(idOrSlug)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
