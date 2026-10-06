import type { FitVehicle, Product, VinVehicle } from './types'

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

// Aplicación del catálogo (`/api/applications/`) con lo que hace falta para
// cruzarla con un vehículo de VIN.
type FitApplication = { id: string; make: string; yearFrom: number; yearTo: number; engine: string }

// Aplicaciones donde cae un vehículo de VIN: misma marca, año dentro del rango y
// cilindrada igual cuando el VIN la trae. Un dato ausente no descarta, igual
// que el chequeo del backend.
function vinApplicationIds(vehicle: VinVehicle, applications: FitApplication[]): string[] {
  const year = Number(vehicle.year || 0)
  const make = normalizeMake(vehicle.make)
  const liters = extractEngineLiters(vehicle.engine)
  return applications
    .filter((app) => {
      if (make && normalizeMake(app.make) !== make) return false
      if (year && (year < Number(app.yearFrom || 0) || year > Number(app.yearTo || 9999))) return false
      const appLiters = extractEngineLiters(app.engine)
      return liters === null || appLiters === null || Math.abs(liters - appLiters) <= 0.11
    })
    .map((app) => app.id)
}

// Con `applicationIds` (las filas de compatibilidad del backend) la respuesta
// sale de la relación: por el id exacto de la aplicación elegida en el garaje
// o, para un vehículo de VIN, cruzándolo con `applications`. Sin ids, o sin
// las aplicaciones para cruzar un VIN, se cae a la comparación por texto.
export function productFitsVehicle(
  product: Product,
  vehicle: FitVehicle,
  applications?: FitApplication[],
): boolean {
  const ids = product.applicationIds ?? []
  if (!ids.length) return productMatchesVinVehicle(product, vehicle)
  if (vehicle.applicationId) {
    if (!ids.includes(vehicle.applicationId)) return false
  } else if (applications?.length) {
    if (!vinApplicationIds(vehicle, applications).some((id) => ids.includes(id))) return false
  } else {
    return productMatchesVinVehicle(product, vehicle)
  }
  // Una aplicación cubre varios años y el producto puede cubrir solo parte.
  const year = Number(vehicle.year || 0)
  const from = Number(product.yearFrom || 0)
  const to = Number(product.yearTo || 9999)
  return !year || (year >= from && year <= to)
}

// La marca es el fabricante de la pieza (Bosch, Garrett), no la del vehículo:
// eso lo resuelve el selector de vehículo. "Alliant Power / Bosch" se parte en
// marcas sueltas, y la lista sale de los productos.
function manufacturerNames(product: Product): string[] {
  return String(product.manufacturer || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function catalogBrands(products: Product[]): string[] {
  const names = new Set<string>()
  for (const product of products) {
    for (const name of manufacturerNames(product)) names.add(name)
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

// Postratamiento de escape controlado por EPA/CARB: estas piezas llevan el
// aviso legal de emisiones en la ficha del producto.
const EMISSIONS_CATEGORIES = new Set(['DPF', 'DOC', 'SCR'])

export function isEmissionsCategory(category: unknown): boolean {
  return EMISSIONS_CATEGORIES.has(canonicalCategory(category))
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

// Un número de parte se busca sin guiones, espacios ni mayúsculas: "502550"
// encuentra "502-550". Un campo puede traer varios separados por "/" o ",",
// y cada uno se compara por separado para no unir dos números distintos.
function compactPartNumber(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function productPartNumbers(product: Product): string[] {
  return [product.partNumber, product.oemPart, product.aftermarketPart, product.remanPart]
    .flatMap((value) => String(value || '').split(/[/,]/))
    .map(compactPartNumber)
    .filter(Boolean)
}

function productMatchesQuery(product: Product, query: string): boolean {
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
  if (text.includes(query.trim().toLowerCase())) return true
  const compact = compactPartNumber(query)
  return Boolean(compact) && productPartNumbers(product).some((number) => number.includes(compact))
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
    vehicle: FitVehicle | null
  },
): Product[] {
  const minPrice = priceBound(options.minPrice)
  const maxPrice = priceBound(options.maxPrice)
  const brand = options.brand.toLowerCase()
  // La marca es un filtro. Sin ella la tienda lista el catálogo.
  return products.filter((product) => {
    const categoryMatch =
      options.category === 'All' ||
      canonicalCategory(product.category) === canonicalCategory(options.category)
    const brandMatch =
      !brand || manufacturerNames(product).some((name) => name.toLowerCase() === brand)
    const price = Number(product.price || 0)
    const priceMatch =
      (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice)
    const conditionMatch =
      !options.condition ||
      String(product.condition || '').trim().toLowerCase() === options.condition.toLowerCase()
    const vehicleMatch = options.vehicle ? productFitsVehicle(product, options.vehicle) : true
    if (!categoryMatch || !brandMatch || !priceMatch || !conditionMatch || !vehicleMatch) return false
    if (!options.query.trim()) return true
    return productMatchesQuery(product, options.query)
  })
}
