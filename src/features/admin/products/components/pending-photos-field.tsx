import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from '../api'
import type { PendingPhoto } from '../types'

import { MAX_IMAGES } from './product-images-field'

type PendingPhotosFieldProps = {
  photos: PendingPhoto[]
  disabled: boolean
  onChange: (photos: PendingPhoto[]) => void
}

// Fotos de un producto que todavía no existe. La galería se guarda contra el
// id del producto, así que quedan en memoria y se suben cuando el alta ya guardó.
export function PendingPhotosField({ photos, disabled, onChange }: PendingPhotosFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')

  function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (!files.length) return
    setNotice('')
    const room = MAX_IMAGES - photos.length
    const fitting = files.filter((file) => file.size <= MAX_PRODUCT_IMAGE_BYTES).slice(0, room)
    if (fitting.length < files.length) {
      setNotice(
        files.length > room
          ? `A product can have up to ${MAX_IMAGES} photos.`
          : 'Photos over 4 MB were skipped.',
      )
    }
    if (fitting.length) {
      onChange([...photos, ...fitting.map((file) => ({ file, url: URL.createObjectURL(file) }))])
    }
  }

  function remove(photo: PendingPhoto) {
    URL.revokeObjectURL(photo.url)
    onChange(photos.filter((item) => item !== photo))
  }

  return (
    <div className="space-y-3">
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.url} className="space-y-2 rounded-md border p-2">
              <div className="relative h-28 overflow-hidden rounded bg-neutral-100">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-contain"
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-neutral-950 px-1.5 py-0.5 text-xs text-white">
                    Cover
                  </span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                aria-label={`Remove photo ${index + 1}`}
                disabled={disabled}
                onClick={() => remove(photo)}
              >
                Remove
              </Button>
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
          disabled={disabled || photos.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          Add photos
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 4 MB each. The first photo is the cover. Photos upload when you
          save the product.
        </p>
      </div>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
    </div>
  )
}
