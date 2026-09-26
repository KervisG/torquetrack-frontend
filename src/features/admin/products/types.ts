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
