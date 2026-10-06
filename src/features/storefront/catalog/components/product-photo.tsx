import { Package } from 'lucide-react'

import { categoryLabel } from '../filter-products'

type ProductPhotoProps = {
  src?: string
  partNumber?: string
  // Pistas para el recuadro sin foto: qué pieza es y de qué marca.
  category?: string
  brand?: string
  className?: string
  // `compact` en la tarjeta del listado; la ficha usa el tamaño grande.
  size?: 'compact' | 'large'
}

// placehold.co pinta un recuadro casi negro. Sin foto real se muestra un
// recuadro neutro con la categoría, la marca y el número de parte.
function isPlaceholder(src: string | undefined): boolean {
  return !src || src.includes('placehold.co')
}

export function ProductPhoto({
  src,
  partNumber,
  category,
  brand,
  className,
  size = 'compact',
}: ProductPhotoProps) {
  if (!isPlaceholder(src)) {
    return <img src={src} alt="" className={className ?? 'h-full w-full object-contain'} />
  }

  const hint = [category ? categoryLabel(category) : '', brand?.trim() ?? '']
    .filter(Boolean)
    .join(' · ')
  const large = size === 'large'

  return (
    <div
      role="img"
      aria-label={hint ? `No photo available: ${hint}` : 'No photo available'}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-neutral-50 to-neutral-200 px-3 text-center"
    >
      <span
        className={
          large
            ? 'grid size-20 place-items-center rounded-full bg-white/80 text-neutral-400 shadow-sm'
            : 'grid size-12 place-items-center rounded-full bg-white/80 text-neutral-400 shadow-sm'
        }
      >
        <Package className={large ? 'size-10' : 'size-6'} aria-hidden="true" />
      </span>
      {hint ? (
        <p
          className={
            large
              ? 'text-sm font-semibold text-neutral-700'
              : 'line-clamp-1 text-xs font-semibold text-neutral-700'
          }
        >
          {hint}
        </p>
      ) : null}
      {partNumber ? (
        <p className={large ? 'text-sm text-neutral-500' : 'text-xs text-neutral-500'}>{partNumber}</p>
      ) : null}
      <p className="text-[11px] uppercase tracking-wider text-neutral-400">Photo coming soon</p>
    </div>
  )
}
