import { cn } from '@/lib/utils'

export const CATALOG_CATEGORIES = [
  { name: 'Turbo', image: '/images/categories/turbo.png' },
  { name: 'Injector', image: '/images/categories/injector.png' },
  { name: 'HPFP', image: '/images/categories/hpfp.png' },
  { name: 'HPOP', image: '/images/categories/hpop.png' },
  { name: 'Contamination Kit', image: '/images/categories/contamination-kit.png' },
  { name: 'DPF', image: '/images/categories/dpf.png' },
  { name: 'DOC', image: '/images/categories/doc.png' },
  { name: 'EGR', image: '/images/categories/egr.png' },
  { name: 'Turbo Actuator', image: '/images/categories/turbo-actuator.png' },
  { name: 'Fuel Rail', image: '/images/categories/fuel-rail.png' },
  { name: 'SCR', image: '/images/categories/scr.png' },
] as const

type CategoryPickerProps = {
  value: string
  onChange: (category: string) => void
  layout?: 'tiles' | 'chips'
}

export function CategoryPicker({ value, onChange, layout = 'tiles' }: CategoryPickerProps) {
  if (layout === 'chips') {
    return (
      <div className="flex flex-wrap gap-2">
        {CATALOG_CATEGORIES.map((item) => {
          const selected = value === item.name
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onChange(selected ? 'All' : item.name)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm',
                selected ? 'border-foreground' : 'border-border hover:border-foreground/40',
              )}
            >
              <img src={item.image} alt="" className="size-5 object-contain" />
              {item.name}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {CATALOG_CATEGORIES.map((item) => {
        const selected = value === item.name
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onChange(selected ? 'All' : item.name)}
            className={cn(
              'rounded-xl border bg-card p-3 text-center shadow-sm',
              selected ? 'border-foreground' : 'border-border hover:border-foreground/40',
            )}
          >
            <div className="mx-auto flex h-16 items-center justify-center rounded-md bg-muted">
              <img src={item.image} alt="" className="h-12 w-12 object-contain" />
            </div>
            <span className="mt-2 block text-xs font-medium leading-tight">{item.name}</span>
          </button>
        )
      })}
    </div>
  )
}
