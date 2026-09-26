import type { Product, VinVehicle } from './types'

function normalizeText(value: unknown): string {
  return String(value || '').trim().toUpperCase()
}

function normalizeMake(value: unknown): string {
  const make = normalizeText(value).toLowerCase()
  if (make === 'chevy') return 'chevrolet'
  if (make === 'dodge') return 'ram'
  return make
}

function extractEngineLiters(value: unknown): number | null {
  const match = String(value || '')
    .toLowerCase()
    .match(/\b(5\.9|6\.0|6\.4|6\.5|6\.6|6\.7|7\.3)\b/)
  return match ? Number(match[1]) : null
}

export function canonicalCategory(value: unknown): string {
  const cat = normalizeText(value).replace(/[^A-Z0-9]+/g, ' ').trim()
  const aliases: Record<string, string> = {
    TURBO: 'TURBO',
    TURBOCHARGER: 'TURBO',
    TURBOCHARGERS: 'TURBO',
    INJECTOR: 'INJECTOR',
    INJECTORS: 'INJECTOR',
    'FUEL INJECTOR': 'INJECTOR',
    'FUEL INJECTORS': 'INJECTOR',
    HPFP: 'HPFP',
    'HIGH PRESSURE FUEL PUMP': 'HPFP',
    'HIGH PRESSURE FUEL PUMPS': 'HPFP',
    HPOP: 'HPOP',
    'CONTAMINATION KIT': 'CONTAMINATION KIT',
    'CONTAMINATION KITS': 'CONTAMINATION KIT',
    DPF: 'DPF',
    DOC: 'DOC',
    EGR: 'EGR',
    'TURBO ACTUATOR': 'TURBO ACTUATOR',
    'TURBO ACTUATORS': 'TURBO ACTUATOR',
    'FUEL RAIL': 'FUEL RAIL',
    'FUEL RAILS': 'FUEL RAIL',
    SCR: 'SCR',
  }
  return aliases[cat] || cat
}

function productMakeMatchesVin(productMake: unknown, vehicleMake: unknown): boolean {
  const pMake = normalizeMake(productMake)
  const vMake = normalizeMake(vehicleMake)
  if (!vMake) return true
  if (!pMake) return false
  if (vMake === 'chevrolet' || vMake === 'gmc') {
    return pMake.includes(vMake) || (pMake.includes('chevrolet') && pMake.includes('gmc'))
  }
  if (vMake === 'ram') {
    return pMake.includes('ram') || pMake.includes('dodge')
  }
  return pMake.includes(vMake) || vMake.includes(pMake)
}

export function productMatchesVinVehicle(product: Product, vehicle: VinVehicle): boolean {
  const vinYear = Number(vehicle.year || 0)
  const from = Number(product.yearFrom || 0)
  const to = Number(product.yearTo || 9999)
  if (vinYear && (vinYear < from || vinYear > to)) return false
  if (!productMakeMatchesVin(product.make, vehicle.make)) return false

  const seriesPattern = /(?:F[- ]?)(250|350|450|550)|\b(2500|3500|4500|5500)\b/g
  const extractSeries = (value: string) => {
    const found = new Set<string>()
    let match = seriesPattern.exec(value)
    while (match) {
      found.add(match[1] || match[2])
      match = seriesPattern.exec(value)
    }
    seriesPattern.lastIndex = 0
    return found
  }
  const vehicleSeries = extractSeries(normalizeText(vehicle.model))
  const productSeries = extractSeries(normalizeText(product.model))
  if (vehicleSeries.size && productSeries.size) {
    if (![...vehicleSeries].some((series) => productSeries.has(series))) return false
  }

  const vinLiters = extractEngineLiters(vehicle.engine)
  const productLiters = extractEngineLiters(
    [product.engine, product.engineFamily, product.engineCode, product.fitment]
      .filter(Boolean)
      .join(' '),
  )
  if (vinLiters !== null && productLiters !== null && Math.abs(vinLiters - productLiters) > 0.11) {
    return false
  }
  return true
}

// Parte "Chevrolet / GMC" en marcas sueltas. La lista sale de los productos,
// así que una marca nueva no hay que registrarla en la pantalla.
export function catalogBrands(products: Product[]): string[] {
  const names = new Set<string>()
  for (const product of products) {
    for (const part of String(product.make || '').split('/')) {
      const name = part.trim()
      if (name) names.add(name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

// Nombres legibles de las categorías que ya usamos. Una categoría nueva no
// está aquí: el menú muestra el texto guardado en el producto.
const CATEGORY_LABELS: Record<string, string> = {
  TURBO: 'Turbo',
  INJECTOR: 'Injector',
  HPFP: 'High-pressure fuel pump',
  HPOP: 'High-pressure oil pump',
  'CONTAMINATION KIT': 'Contamination kit',
  DPF: 'Particulate filter',
  DOC: 'Oxidation catalyst',
  EGR: 'EGR valve',
  'TURBO ACTUATOR': 'Turbo actuator',
  'FUEL RAIL': 'Fuel rail',
  SCR: 'DEF system',
}

export type CatalogCategory = {
  value: string
  label: string
}

export function categoryLabel(category: string): string {
  const canonical = canonicalCategory(category)
  return CATEGORY_LABELS[canonical] || category.trim()
}

// Igual que las marcas: la lista sale de los productos, no de una lista fija.
export function catalogCategories(products: Product[]): CatalogCategory[] {
  const byValue = new Map<string, string>()
  for (const product of products) {
    const raw = String(product.category || '').trim()
    if (!raw) continue
    const value = canonicalCategory(raw)
    if (!byValue.has(value)) byValue.set(value, categoryLabel(raw))
  }
  return [...byValue.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'))
}

// Igual que las marcas: New, Remanufactured o Used salen de lo guardado
// en el producto. Una condición nueva no hay que registrarla en la pantalla.
export function catalogConditions(products: Product[]): string[] {
  const names = new Set<string>()
  for (const product of products) {
    const name = String(product.condition || '').trim()
    if (name) names.add(name)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

// Vacío no acota. El comprador puede escribir 1,000 o $1,000.
function priceBound(value: string): number | null {
  const trimmed = value.replace(/[$,\s]/g, '')
  if (!trimmed) return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount)) return null
  return amount
}

export function filterProducts(
  products: Product[],
  options: {
    brand: string
    category: string
    query: string
    minPrice: string
    maxPrice: string
    condition: string
    vehicle: VinVehicle | null
  },
): Product[] {
  const minPrice = priceBound(options.minPrice)
  const maxPrice = priceBound(options.maxPrice)
  // La marca es un filtro. Sin ella la tienda lista el catálogo.
  return products.filter((product) => {
    const categoryMatch =
      options.category === 'All' ||
      canonicalCategory(product.category) === canonicalCategory(options.category)
    const brandMatch =
      !options.brand ||
      (product.make || '').toLowerCase().includes(options.brand.toLowerCase())
    const price = Number(product.price || 0)
    const priceMatch =
      (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice)
    const conditionMatch =
      !options.condition ||
      String(product.condition || '').trim().toLowerCase() === options.condition.toLowerCase()
    const vinMatch = options.vehicle
      ? productMatchesVinVehicle(product, options.vehicle)
      : true
    if (!categoryMatch || !brandMatch || !priceMatch || !conditionMatch || !vinMatch) return false
    if (!options.query) return true
    return [
      product.title,
      product.category,
      product.make,
      product.manufacturer,
      product.type,
      product.oemPart,
      product.partNumber,
      product.fitment,
      product.engine,
      product.engineFamily,
      product.engineCode,
      product.supplier,
    ]
      .join(' ')
      .toLowerCase()
      .includes(options.query.toLowerCase())
  })
}
