import { cn } from '@/lib/utils'

type BrandMarkProps = {
  variant?: 'full' | 'small'
  className?: string
  // Sin label el monograma es decorativo: casi siempre va junto al nombre escrito.
  label?: string
}

// Monograma "TT": dos T iguales separadas. La variante small tiene trazos
// ajustados a la grilla de 32 px para que no se emborrone a tamaño de icono;
// la full se usa desde unos 40 px de ancho.
const variants = {
  full: {
    viewBox: '0 0 106 58',
    paths: ['M0 0H51V14H34.5V58H16.5V14H0Z', 'M55 0H106V14H89.5V58H71.5V14H55Z'],
  },
  small: {
    viewBox: '0 0 32 18',
    paths: ['M0 0H15V4H10V18H5V4H0Z', 'M17 0H32V4H27V18H22V4H17Z'],
  },
}

export function BrandMark({ variant = 'full', className, label }: BrandMarkProps) {
  const { viewBox, paths } = variants[variant]
  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      className={cn('shrink-0', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
