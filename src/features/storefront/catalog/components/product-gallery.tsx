import { useState } from 'react'

import type { Product } from '../types'

import { ProductPhoto } from './product-photo'

// Foto grande de la ficha. Con más de una foto suma las miniaturas para
// elegir cuál ver; con una sola, o sin fotos, es el recuadro de siempre.
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images ?? []
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // La elegida, o la portada si todavía no se eligió (o si ya no existe).
  const selected = images.find((image) => image.id === selectedId) ?? images[0]

  return (
    <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
      <div className="h-[28rem] overflow-hidden rounded-md border bg-neutral-100 lg:h-[32rem]">
        {selected ? (
          <img
            src={selected.url}
            alt={selected.alt || product.title || ''}
            className="h-full w-full object-contain p-8"
          />
        ) : (
          <ProductPhoto
            src={product.image}
            partNumber={product.partNumber}
            category={product.category}
            brand={product.manufacturer}
            size="large"
            className="h-full w-full object-contain p-8"
          />
        )}
      </div>
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Product photos">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-pressed={image.id === selected?.id}
                className={
                  image.id === selected?.id
                    ? 'size-16 overflow-hidden rounded-md border-2 border-amber-500 bg-neutral-100'
                    : 'size-16 overflow-hidden rounded-md border bg-neutral-100 hover:border-neutral-400'
                }
                onClick={() => setSelectedId(image.id)}
              >
                <img src={image.url} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
