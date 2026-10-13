import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { ApiError } from '@/lib/api-client'

import {
  deleteProductImage,
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
  reorderProductImages,
  uploadProductImage,
} from '../api'
import { adminProductKeys } from '../query-keys'
import type { AdminProductImage } from '../types'

export const MAX_IMAGES = 12

type ProductImagesFieldProps = {
  productId: string
  initialImages: AdminProductImage[]
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not update the photos. Try again.'
}

// Galería del producto. Cada acción se guarda al instante, aparte del
// formulario: subir, borrar o reordenar no espera al botón "Save".
export function ProductImagesField({ productId, initialImages }: ProductImagesFieldProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initialImages)
  const [notice, setNotice] = useState('')

  // El panel y la tienda muestran la portada: los dos vuelven a pedir sus datos.
  async function refresh(next: AdminProductImage[]) {
    setImages(next)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
    ])
  }

  const upload = useMutation({
    // De a una: si una falla, las anteriores ya quedaron guardadas.
    mutationFn: async (files: File[]) => {
      for (const file of files) await refresh(await uploadProductImage(productId, file))
    },
  })
  const remove = useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: refresh,
  })
  const reorder = useMutation({
    mutationFn: (order: number[]) => reorderProductImages(productId, order),
    onSuccess: refresh,
  })
  const busy = upload.isPending || remove.isPending || reorder.isPending
  const failure = upload.error ?? remove.error ?? reorder.error

  function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (!files.length) return
    setNotice('')
    for (const mutation of [upload, remove, reorder]) mutation.reset()
    const room = MAX_IMAGES - images.length
    const fitting = files.filter((file) => file.size <= MAX_PRODUCT_IMAGE_BYTES).slice(0, room)
    if (fitting.length < files.length) {
      setNotice(
        files.length > room
          ? `A product can have up to ${MAX_IMAGES} photos.`
          : 'Photos over 4 MB were skipped.',
      )
    }
    if (fitting.length) upload.mutate(fitting)
  }

  function move(index: number, offset: number) {
    const order = images.map((image) => image.id)
    const target = index + offset
    ;[order[index], order[target]] = [order[target], order[index]]
    reorder.mutate(order)
  }

  return (
    <div className="space-y-3">
      {images.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="space-y-2 rounded-md border p-2">
              <div className="relative h-28 overflow-hidden rounded bg-neutral-100">
                <img
                  src={image.url}
                  alt={image.alt || `Photo ${index + 1}`}
                  className="h-full w-full object-contain"
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-neutral-950 px-1.5 py-0.5 text-xs text-white">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={busy || index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  →
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={busy}
                  onClick={() => remove.mutate(image.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PRODUCT_IMAGE_TYPES}
          aria-label="Add photos"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? 'Uploading…' : 'Add photos'}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 4 MB each. The first photo is the cover.
        </p>
      </div>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      {failure ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(failure)}
        </p>
      ) : null}
    </div>
  )
}
