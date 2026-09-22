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

export function filterProducts(
  products: Product[],
  options: {
    brand: string
    category: string
    query: string
    vehicle: VinVehicle | null
  },
): Product[] {
  if (!options.brand) return []

  return products.filter((product) => {
    const categoryMatch =
      options.category === 'All' ||
      canonicalCategory(product.category) === canonicalCategory(options.category)
    const brandMatch = (product.make || '')
      .toLowerCase()
      .includes(options.brand.toLowerCase())
    const vinMatch = options.vehicle
      ? productMatchesVinVehicle(product, options.vehicle)
      : true
    if (!categoryMatch || !brandMatch || !vinMatch) return false
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
