import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

export type ShellNavItem = {
  to: string
  label: string
  icon: LucideIcon
  // Solo para la raíz de la sección: sin `end` quedaría activa en todas sus páginas.
  end?: boolean
}

export type ShellNavGroup = {
  label: string
  items: ShellNavItem[]
}

type SidebarNavProps = {
  label: string
  groups: ShellNavGroup[]
  collapsed?: boolean
  onNavigate?: () => void
}

// Cada grupo cuelga de una línea vertical (el "riel"); la página actual
// enciende su tramo en ámbar, así se ve en qué nivel se está parado. Los
// grupos se pliegan, salvo el que contiene la página actual.
export function SidebarNav({ label, groups, collapsed = false, onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation()
  const [folded, setFolded] = useState<Set<string>>(() => new Set())

  function toggleGroup(group: string) {
    setFolded((current) => {
      const next = new Set(current)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <nav aria-label={label} className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {groups.map((group) => {
        const holdsCurrent = group.items.some((item) =>
          matchPath({ path: item.to, end: item.end ?? false }, pathname),
        )
        const open = collapsed || holdsCurrent || !folded.has(group.label)
        const listId = `nav-group-${group.label.toLowerCase().replace(/\s+/g, '-')}`

        return (
          <div key={group.label}>
            {collapsed ? (
              <p className="sr-only">{group.label}</p>
            ) : (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                // El grupo de la página actual no se pliega: perdería el indicador.
                disabled={holdsCurrent}
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'group mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70',
                  holdsCurrent
                    ? 'cursor-default text-amber-400/90'
                    : 'text-primary-foreground/45 hover:text-primary-foreground/80',
                )}
              >
                {group.label}
                {holdsCurrent ? null : (
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', !open && '-rotate-90')}
                    aria-hidden="true"
                  />
                )}
              </button>
            )}
            {open ? (
              <ul
                id={listId}
                className={cn(
                  'relative',
                  // El riel: una línea fina a la altura de los íconos.
                  !collapsed && 'ml-[17px] space-y-0.5 border-l border-primary-foreground/15',
                  collapsed && 'space-y-1',
                )}
              >
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-3 py-2 text-sm transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70',
                          // Tramo del riel: ámbar en la página actual, tenue al pasar el mouse.
                          'before:absolute before:inset-y-1 before:w-[3px] before:rounded-full before:transition-colors',
                          collapsed
                            ? 'justify-center rounded-md before:left-0'
                            : 'rounded-r-md pl-4 pr-3 before:-left-[2px]',
                          isActive
                            ? 'bg-primary-foreground/[0.07] font-semibold text-primary-foreground before:bg-amber-400'
                            : 'font-medium text-primary-foreground/65 before:bg-transparent hover:text-primary-foreground hover:before:bg-primary-foreground/30',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn('size-4 shrink-0', isActive && 'text-amber-400')}
                            aria-hidden="true"
                          />
                          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
