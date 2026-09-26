type ProductPhotoProps = {
  src?: string
  partNumber?: string
  className?: string
}

// placehold.co pinta un recuadro casi negro. Sin foto real se muestra el número de parte.
function isPlaceholder(src: string | undefined): boolean {
  return !src || src.includes('placehold.co')
}

export function ProductPhoto({ src, partNumber, className }: ProductPhotoProps) {
  if (!isPlaceholder(src)) {
    return <img src={src} alt="" className={className ?? 'h-full w-full object-contain'} />
  }

  return (
    <div className="grid h-full w-full place-items-center bg-neutral-200 px-3 text-center">
      <p className="text-sm font-medium text-neutral-700">{partNumber || 'No photo'}</p>
    </div>
  )
}
