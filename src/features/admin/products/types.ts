import type { Product, ProductImage } from '@/features/storefront/catalog/types'

// La galería como la devuelve el panel: con el orden y el tamaño de cada foto.
export type AdminProductImage = ProductImage & {
  position: number
  width: number | null
  height: number | null
}

export type AdminProduct = Omit<Product, 'images'> & {
  images?: AdminProductImage[]
  active: boolean
  condition?: string
  description?: string
  warranty?: string
  supplierPartNumber?: string
  purchaseCost?: number
  supplierUrl?: string
  internalNotes?: string
}

// Fila de `/api/admin/applications/`: misma forma que la de la tienda.
export type { VehicleApplication as AdminApplication } from '@/features/storefront/garage/types'

export function productFitmentLabel(product: Pick<AdminProduct, 'yearFrom' | 'yearTo' | 'make'>): string {
  const years = [product.yearFrom, product.yearTo].filter(Boolean).join('–')
  return [years, product.make].filter(Boolean).join(' ')
}
