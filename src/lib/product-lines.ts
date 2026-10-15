// Secciones de la portada donde sale una categoría. Los valores son los de
// `ProductLine` del backend; el panel los usa para ubicar una categoría y la
// portada para agruparlas.
export const PRODUCT_LINE_OPTIONS = [
  { value: 'FUEL_SYSTEM', label: 'Fuel system' },
  { value: 'TURBO_AIR', label: 'Turbo & air' },
  { value: 'EMISSIONS', label: 'Emission systems' },
  { value: 'OTHER', label: 'More parts' },
] as const

export type ProductLineValue = (typeof PRODUCT_LINE_OPTIONS)[number]['value']

export const DEFAULT_PRODUCT_LINE: ProductLineValue = 'OTHER'
