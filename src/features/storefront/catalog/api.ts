import { apiRequest } from '@/lib/api-client'

import type { Product } from './types'

export function listProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products')
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await listProducts()
  return products.find((product) => String(product.id) === String(id)) ?? null
}
