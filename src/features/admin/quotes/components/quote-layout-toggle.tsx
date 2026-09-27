import { LayoutGrid, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type QuoteLayout = 'table' | 'icons'

export function QuoteLayoutToggle({
  layout,
  onChange,
}: {
  layout: QuoteLayout
  onChange: (layout: QuoteLayout) => void
}) {
  return (
    <div role="group" aria-label="Layout" className="flex shrink-0 gap-1">
      <Button
        type="button"
        size="sm"
        variant={layout === 'table' ? 'default' : 'ghost'}
        aria-pressed={layout === 'table'}
        onClick={() => onChange('table')}
      >
        <Table2 className="size-4" aria-hidden="true" />
        Table
      </Button>
      <Button
        type="button"
        size="sm"
        variant={layout === 'icons' ? 'default' : 'ghost'}
        aria-pressed={layout === 'icons'}
        onClick={() => onChange('icons')}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        Icons
      </Button>
    </div>
  )
}
