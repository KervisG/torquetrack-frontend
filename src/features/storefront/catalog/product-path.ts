import type { Product } from './types'

// Un producto sin slug (catálogo viejo) sigue enlazando por id.
export function productPath(product: Pick<Product, 'id' | 'slug'>): string {
  return `/product/${encodeURIComponent(product.slug || product.id)}`
}

// La ficha vuelve al listado con los mismos filtros: el catálogo los guarda en
// la query string y se la pasa al enlace como `state` del historial.
export type CatalogReturnState = { catalogSearch: string }

export function catalogReturnState(search: string): CatalogReturnState {
  return { catalogSearch: search }
}

// Un `state` ajeno (o ninguno, si se entró directo a la ficha) vuelve a `/`.
export function catalogReturnPath(state: unknown): string {
  if (!state || typeof state !== 'object') return '/'
  const search = (state as Partial<CatalogReturnState>).catalogSearch
  if (typeof search !== 'string' || !search) return '/'
  return `/?${search.replace(/^\?/, '')}`
}
