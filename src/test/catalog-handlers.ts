import { http, HttpResponse } from 'msw'

import {
  canonicalCategory,
  categoryLabel,
  productFitsVehicle,
} from '@/features/storefront/catalog/filter-products'
import type { FitVehicle, Product } from '@/features/storefront/catalog/types'

export const sampleProduct = {
  id: 'gm-65-injection-pump',
  slug: '6-5l-turbo-diesel-fuel-injection-pump-502-550',
  title: '6.5L Turbo Diesel Fuel Injection Pump',
  category: 'HPFP',
  type: 'Pump',
  make: 'Chevrolet / GMC',
  model: 'C/K 2500 / 3500',
  yearFrom: 1994,
  yearTo: 2000,
  engine: '6.5',
  fitment: '1994-2000 Chevrolet / GMC 6.5L',
  manufacturer: 'Dorman',
  partNumber: '502-550',
  oemPart: '12561204',
  price: 189.99,
  coreCharge: 25,
  image: '/images/products/pump.png',
}

const PAGE_SIZE = 16

// "Alliant Power / Bosch" son dos marcas sueltas.
function manufacturerNames(product: Product): string[] {
  return String(product.manufacturer || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
}

function distinct(values: unknown[]): string[] {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'en'),
  )
}

function compactPartNumber(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function matchesQuery(product: Product, query: string): boolean {
  const text = [
    product.title,
    product.category,
    product.make,
    product.model,
    product.manufacturer,
    product.type,
    product.oemPart,
    product.partNumber,
    product.aftermarketPart,
    product.remanPart,
    product.fitment,
    product.engine,
    product.engineFamily,
    product.engineCode,
  ]
    .join(' ')
    .toLowerCase()
  if (text.includes(query.toLowerCase())) return true
  const compact = compactPartNumber(query)
  return (
    Boolean(compact) &&
    [product.partNumber, product.oemPart, product.aftermarketPart, product.remanPart]
      .flatMap((value) => String(value || '').split(/[/,]/))
      .map(compactPartNumber)
      .some((number) => number.includes(compact))
  )
}

function priceBound(value: string | null): number | null {
  const trimmed = (value ?? '').replace(/[$,\s]/g, '')
  if (!trimmed) return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) ? amount : null
}

function vehicleFrom(params: URLSearchParams): FitVehicle | null {
  const vehicle = {
    vin: '',
    year: params.get('vehicleYear') ?? '',
    make: params.get('vehicleMake') ?? '',
    model: params.get('vehicleModel') ?? '',
    engine: params.get('vehicleEngine') ?? '',
    applicationId: params.get('applicationId') ?? undefined,
  }
  return vehicle.year || vehicle.make || vehicle.model || vehicle.engine || vehicle.applicationId
    ? vehicle
    : null
}

// La portada: cuántos productos hay por categoría y por marca de vehículo.
function catalogOverview(products: Product[]) {
  const tally = (values: string[]) =>
    [...new Set(values)].map((name) => ({
      name,
      count: values.filter((value) => value === name).length,
    }))
  const categories = products.map((product) => canonicalCategory(product.category))
  return {
    productCount: products.length,
    categories: tally(categories).map(({ name, count }) => ({
      value: name,
      label: categoryLabel(name),
      count,
      brands: distinct(
        products
          .filter((product) => canonicalCategory(product.category) === name)
          .flatMap(manufacturerNames),
      ),
    })),
    makes: tally(products.map((product) => String(product.make || '')).filter(Boolean)),
  }
}

// Lo mismo que `search_products` del backend, para un catálogo de prueba: una
// página con sus totales y, salvo con `ids`, las opciones de los filtros.
export function searchCatalog(products: Product[], params: URLSearchParams) {
  const ids = (params.get('ids') ?? '').split(',').filter(Boolean)
  const query = (params.get('q') ?? '').trim()
  const brand = (params.get('brand') ?? '').toLowerCase()
  const category = params.get('category') ?? ''
  const condition = (params.get('condition') ?? '').toLowerCase()
  const min = priceBound(params.get('min'))
  const max = priceBound(params.get('max'))
  const vehicle = vehicleFrom(params)
  const sort = params.get('sort')

  const rows = products.filter((product) => {
    const price = Number(product.price || 0)
    return (
      (!ids.length || ids.includes(product.id)) &&
      (!query || matchesQuery(product, query)) &&
      (!brand || manufacturerNames(product).some((name) => name.toLowerCase() === brand)) &&
      (!category || canonicalCategory(product.category) === canonicalCategory(category)) &&
      (!condition || String(product.condition || '').trim().toLowerCase() === condition) &&
      (min === null || price >= min) &&
      (max === null || price <= max) &&
      (!vehicle || productFitsVehicle(product, vehicle))
    )
  })
  if (sort === 'low') rows.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort === 'high') rows.sort((a, b) => Number(b.price) - Number(a.price))

  const pageSize = ids.length ? 100 : PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), pageCount)
  const body = {
    count: rows.length,
    page,
    pageSize,
    pageCount,
    results: rows.slice((page - 1) * pageSize, page * pageSize),
  }
  if (ids.length) return body
  return {
    ...body,
    ...(params.get('overview') ? { overview: catalogOverview(products) } : {}),
    facets: {
      brands: distinct(products.flatMap(manufacturerNames)),
      categories: distinct(products.map((product) => product.category)),
      conditions: distinct(products.map((product) => product.condition)),
      priceCeiling: Math.ceil(Math.max(0, ...products.map((product) => Number(product.price || 0)))),
    },
  }
}

// `/api/products/` de un catálogo de prueba, con sus filtros y su paginación.
export function productsApi(products: Product[]) {
  return http.get('/api/products/', ({ request }) =>
    HttpResponse.json(searchCatalog(products, new URL(request.url).searchParams)),
  )
}

export function productsOk() {
  return productsApi([sampleProduct])
}

// Detalle por id o por slug, como el backend; cualquier otro valor es 404.
export function productDetailOk(product: typeof sampleProduct = sampleProduct) {
  return http.get('/api/products/:idOrSlug/', ({ params }) =>
    params.idOrSlug === product.id || params.idOrSlug === product.slug
      ? HttpResponse.json(product)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 }),
  )
}
