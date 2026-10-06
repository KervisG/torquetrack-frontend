import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { FormError } from '@/components/form-error'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { SidebarNav, type ShellNavGroup, type ShellNavItem } from './sidebar-nav'
import { useSidebarCollapsed } from './use-sidebar-collapsed'
import { UserMenu, type ShellUser } from './user-menu'

type AppShellProps = {
  navLabel: string
  homeHref: string
  area: string
  groups: ShellNavGroup[]
  user: ShellUser
  onSignOut: () => void
  signingOut: boolean
  signOutError: unknown
  children: ReactNode
  // El panel usa todo el ancho junto a la barra: las tablas quedan pegadas
  // a la izquierda. El portal sigue en `max-w-6xl`.
  wide?: boolean
}

// Layout del panel y del portal: barra lateral fija en escritorio y cajón en
// móvil. El estado de datos (sesión, permisos, sign out) lo resuelve
// `PanelShell` y llega por props.
export function AppShell({
  navLabel,
  homeHref,
  area,
  groups,
  user,
  onSignOut,
  signingOut,
  signOutError,
  children,
  wide = false,
}: AppShellProps) {
  const { collapsed, toggle } = useSidebarCollapsed()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const current = currentSection(groups, pathname)

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <aside
        aria-label="Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-primary text-primary-foreground transition-[width] duration-200 md:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <Brand homeHref={homeHref} area={area} collapsed={collapsed} />
        <SidebarNav label={navLabel} groups={groups} collapsed={collapsed} />
        <div className="border-t border-primary-foreground/10 p-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className={cn(collapsed && 'sr-only')}>Collapse</span>
          </button>
        </div>
      </aside>

      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'md:pl-16' : 'md:pl-64')}>
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center gap-3 px-4 md:px-8">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="-ml-2 rounded-md p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                aria-describedby={undefined}
                className="flex w-72 flex-col border-r-0 bg-primary p-0 text-primary-foreground"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand homeHref={homeHref} area={area} onNavigate={() => setDrawerOpen(false)} />
                <SidebarNav label={navLabel} groups={groups} onNavigate={() => setDrawerOpen(false)} />
              </SheetContent>
            </Sheet>
            <Breadcrumb current={current} pathname={pathname} />
            <div className="ml-auto">
              <UserMenu user={user} onSignOut={onSignOut} signingOut={signingOut} />
            </div>
          </div>
          <div className="px-4 pb-3 empty:hidden md:px-8">
            <FormError error={signOutError} />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'w-full flex-1 px-4 py-6 focus:outline-none md:px-8 md:py-8',
            wide ? 'max-w-none' : 'mx-auto max-w-6xl',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

function Brand({
  homeHref,
  area,
  collapsed = false,
  onNavigate,
}: {
  homeHref: string
  area: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <div className={cn('flex h-14 shrink-0 items-center border-b border-primary-foreground/10 px-4', collapsed && 'justify-center px-0')}>
      <Link
        to={homeHref}
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
      >
        {/* Variante small a 32x18 px exactos: los trazos caen en píxeles enteros. */}
        <span className="flex size-8 shrink-0 items-center justify-center">
          <BrandMark variant="small" className="h-[18px] w-8 text-primary-foreground" />
        </span>
        <span className={cn('leading-tight', collapsed && 'sr-only')}>
          <span className="block text-sm font-semibold">TorqueTrack</span>
          <span className="block text-xs text-primary-foreground/60">{area}</span>
        </span>
      </Link>
    </div>
  )
}

type CurrentSection = { group: string; item: ShellNavItem }

// La sección activa es la entrada más específica que matchea la URL, así el
// detalle de un pedido sigue mostrando "Orders".
function currentSection(groups: ShellNavGroup[], pathname: string): CurrentSection | undefined {
  let best: CurrentSection | undefined
  for (const group of groups) {
    for (const item of group.items) {
      if (!matchPath({ path: item.to, end: item.end ?? false }, pathname)) continue
      if (!best || item.to.length > best.item.to.length) best = { group: group.label, item }
    }
  }
  return best
}

function Breadcrumb({ current, pathname }: { current?: CurrentSection; pathname: string }) {
  if (!current) return null
  const onSectionRoot = matchPath({ path: current.item.to, end: true }, pathname) !== null

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden text-muted-foreground sm:block">{current.group}</li>
        <li aria-hidden="true" className="hidden text-muted-foreground sm:block">
          <ChevronRight className="size-4" />
        </li>
        <li className="truncate font-medium">
          {onSectionRoot ? (
            <span aria-current="page">{current.item.label}</span>
          ) : (
            <Link to={current.item.to} className="hover:underline">
              {current.item.label}
            </Link>
          )}
        </li>
      </ol>
    </nav>
  )
}
