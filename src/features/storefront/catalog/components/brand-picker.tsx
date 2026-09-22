import { cn } from '@/lib/utils'

export const CATALOG_BRANDS = [
  { name: 'Ford', image: '/images/brands/ford.png', truck: '/images/hero/ford-truck.png' },
  { name: 'Chevrolet', image: '/images/brands/chevrolet.png', truck: '/images/hero/chevrolet-truck.png' },
  { name: 'GMC', image: '/images/brands/gmc.png', truck: '/images/hero/gmc-truck.png' },
  { name: 'RAM', image: '/images/brands/ram.png', truck: '/images/hero/ram-truck.png' },
] as const

type BrandPickerProps = {
  value: string
  onChange: (brand: string) => void
  size?: 'hero' | 'compact'
}

export function BrandPicker({ value, onChange, size = 'hero' }: BrandPickerProps) {
  return (
    <div className={cn('grid gap-3', size === 'hero' ? 'grid-cols-2' : 'grid-cols-4')}>
      {CATALOG_BRANDS.map((brand) => {
        const selected = value === brand.name
        return (
          <button
            key={brand.name}
            type="button"
            onClick={() => onChange(brand.name)}
            className={cn(
              'overflow-hidden rounded-xl border bg-background text-left',
              selected ? 'border-foreground' : 'border-border hover:border-foreground/40',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center bg-muted',
                size === 'hero' ? 'h-28 sm:h-36' : 'h-16',
              )}
            >
              <img src={brand.truck} alt="" className="h-full w-full object-contain p-2" />
            </div>
            <span className="flex items-center justify-center gap-2 px-2 py-2 text-sm font-semibold">
              <img src={brand.image} alt="" className="h-4 object-contain" />
              {brand.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
