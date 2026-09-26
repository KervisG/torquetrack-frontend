import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

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

export function SidebarNav({ label, groups, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label={label} className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p
            className={cn(
              'mb-2 px-3 text-xs font-medium uppercase tracking-wider text-primary-foreground/50',
              collapsed && 'sr-only',
            )}
          >
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
