import { cn } from '@/lib/utils'

import { HOUSE_BRAND } from '../house-brand'

export function HouseBrandBadge({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'w-fit rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-neutral-950',
        className,
      )}
    >
      {HOUSE_BRAND} brand
    </p>
  )
}
