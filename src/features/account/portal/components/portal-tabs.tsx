import { cn } from '@/lib/utils'

type PortalTabsProps<T extends string> = {
  tabs: ReadonlyArray<{ id: T; label: string }>
  active: T
  onSelect: (id: T) => void
}

export function PortalTabs<T extends string>({ tabs, active, onSelect }: PortalTabsProps<T>) {
  return (
    <div role="tablist" aria-label="Account sections" className="flex flex-wrap gap-2 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === active}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onSelect(tab.id)}
          className={cn(
            '-mb-px border-b-2 px-3 py-2 text-sm',
            tab.id === active
              ? 'border-foreground font-medium text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
