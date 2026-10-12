// Logos de los fabricantes que vende la tienda, para la portada. Salen de
// Wikimedia Commons (dominio público) y de Simple Icons (Bosch, Ford, GM).
// Una marca sin logo se muestra como texto.
const BRAND_LOGOS: Record<string, string> = {
  acdelco: '/images/brands/acdelco.svg',
  borgwarner: '/images/brands/borgwarner.svg',
  bosch: '/images/brands/bosch.svg',
  cummins: '/images/brands/cummins.svg',
  ford: '/images/brands/ford.svg',
  garrett: '/images/brands/garrett.svg',
  gm: '/images/brands/generalmotors.svg',
  'gm genuine parts': '/images/brands/generalmotors.svg',
  mopar: '/images/brands/mopar.svg',
  motorcraft: '/images/brands/motorcraft.svg',
}

export function brandLogo(brand: string): string | undefined {
  return BRAND_LOGOS[brand.trim().toLowerCase()]
}
