import type { Product } from './types'

// El catálogo. La portada (`/`) cuenta qué vende la tienda y enlaza aquí.
export const SHOP_PATH = '/shop'

// Un producto sin slug (catálogo viejo) sigue enlazando por id.
export function productPath(product: Pick<Product, 'id' | 'slug'>): string {
  return `/product/${encodeURIComponent(product.slug || product.id)}`
}

// El catálogo ya filtrado, para los enlaces de la portada.
export function shopPath(filters: Record<string, string>): string {
  const query = new URLSearchParams(filters).toString()
  return query ? `${SHOP_PATH}?${query}` : SHOP_PATH
}

// La ficha vuelve al listado con los mismos filtros: el catálogo los guarda en
// la query string y se la pasa al enlace como `state` del historial.
type CatalogReturnState = { catalogSearch: string }

export function catalogReturnState(search: string): CatalogReturnState {
  return { catalogSearch: search }
}

// Un `state` ajeno (o ninguno, si se entró directo a la ficha) vuelve al
// catálogo sin filtros.
export function catalogReturnPath(state: unknown): string {
  if (!state || typeof state !== 'object') return SHOP_PATH
  const search = (state as Partial<CatalogReturnState>).catalogSearch
  if (typeof search !== 'string' || !search) return SHOP_PATH
  return `${SHOP_PATH}?${search.replace(/^\?/, '')}`
}
