import { LayoutGrid, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type ProductLayout = 'list' | 'cards'

export function ProductLayoutToggle({
  layout,
  onChange,
}: {
  layout: ProductLayout
  onChange: (layout: ProductLayout) => void
}) {
  return (
    <div role="group" aria-label="Layout" className="flex shrink-0 gap-1">
      <Button
        type="button"
        size="sm"
        variant={layout === 'list' ? 'default' : 'ghost'}
        aria-pressed={layout === 'list'}
        onClick={() => onChange('list')}
      >
        <Table2 className="size-4" aria-hidden="true" />
        List
      </Button>
      <Button
        type="button"
        size="sm"
        variant={layout === 'cards' ? 'default' : 'ghost'}
        aria-pressed={layout === 'cards'}
        onClick={() => onChange('cards')}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        Cards
      </Button>
    </div>
  )
}
