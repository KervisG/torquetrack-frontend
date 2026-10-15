// Marca propia de la tienda: sus productos llevan una etiqueta especial en el
// catálogo y en la ficha. El backend la guarda como `manufacturer`.
export const HOUSE_BRAND = 'TorqueTrack'

export function isHouseBrand(manufacturer: string | undefined): boolean {
  return manufacturer?.trim().toLowerCase() === HOUSE_BRAND.toLowerCase()
}
