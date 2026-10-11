import { ApiError, apiRequest } from '@/lib/api-client'

import type { FitVehicle, Product } from './types'

// Filtros del catálogo tal como viven en la URL de la tienda. El servidor
// busca, filtra, ordena y pagina; un valor vacío no se manda.
export type ProductSearch = {
  query: string
  brand: string
  category: string
  condition: string
  minPrice: string
  maxPrice: string
  sort: string
  page: number
  vehicle: FitVehicle | null
}

// Opciones de los filtros: salen de todo el catálogo, no de la página.
export type ProductFacets = {
  brands: string[]
  categories: string[]
  conditions: string[]
  priceCeiling: number
}

export type ProductPage = {
  count: number
  page: number
  pageSize: number
  pageCount: number
  results: Product[]
  facets: ProductFacets
}

function searchParams(search: ProductSearch): string {
  const vehicle = search.vehicle
  const values: Record<string, string> = {
    q: search.query.trim(),
    brand: search.brand,
    category: search.category === 'All' ? '' : search.category,
    condition: search.condition,
    min: search.minPrice.trim(),
    max: search.maxPrice.trim(),
    sort: search.sort === 'featured' ? '' : search.sort,
    page: search.page > 1 ? String(search.page) : '',
    applicationId: vehicle?.applicationId ?? '',
    vehicleYear: vehicle?.year ?? '',
    vehicleMake: vehicle?.make ?? '',
    vehicleModel: vehicle?.model ?? '',
    vehicleEngine: vehicle?.engine ?? '',
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
  }
  return params.toString()
}

export function searchProducts(search: ProductSearch, signal?: AbortSignal): Promise<ProductPage> {
  const query = searchParams(search)
  return apiRequest<ProductPage>(query ? `/products?${query}` : '/products', { signal })
}

// Los productos del carrito: la tienda ya no baja el catálogo entero para
// encontrarlos. Sin ids no hay request.
export async function listProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return []
  const params = new URLSearchParams({ ids: ids.join(',') })
  const page = await apiRequest<{ results: Product[] }>(`/products?${params.toString()}`)
  return page.results
}

// Qué vende la tienda, para la portada: productos por categoría y por marca
// de vehículo, y los fabricantes de cada categoría. Sale de los datos reales.
export type CatalogOverview = {
  productCount: number
  categories: Array<{ value: string; label: string; count: number; brands: string[] }>
  makes: Array<{ name: string; count: number }>
}

export async function getCatalogOverview(): Promise<CatalogOverview> {
  const page = await apiRequest<{ overview: CatalogOverview }>('/products?overview=1&pageSize=1')
  return page.overview
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
