import type { Product } from '@/features/storefront/catalog/types'

export type AdminProduct = Product & {
  active: boolean
  condition?: string
  description?: string
  warranty?: string
  supplierPartNumber?: string
  purchaseCost?: number
  supplierUrl?: string
  internalNotes?: string
}

export function productFitmentLabel(product: Pick<AdminProduct, 'yearFrom' | 'yearTo' | 'make'>): string {
  const years = [product.yearFrom, product.yearTo].filter(Boolean).join('–')
  return [years, product.make].filter(Boolean).join(' ')
}
