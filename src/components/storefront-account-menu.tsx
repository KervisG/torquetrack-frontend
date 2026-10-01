import { ChevronDown, CircleUser, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { useId } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useDismissableMenu } from '@/components/use-dismissable-menu'
import { useSignOut } from '@/features/account/auth/hooks/use-sign-out'
import { displayName, type SessionUser } from '@/features/account/auth/types'

const itemClass =
  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none disabled:opacity-50'

// Un solo acceso a la cuenta en la cabecera de la tienda: juntar portal, panel
// y salida en un desplegable evita confundirlos. Mismo patrón de disclosure que
// el `UserMenu` del panel (sin `role="menu"`, se recorre con Tab).
export function StorefrontAccountMenu({ user }: { user: SessionUser }) {
  const { pathname } = useLocation()
  const { open, toggle, close, rootRef, triggerRef } = useDismissableMenu(pathname)
  const signOut = useSignOut()
  const panelId = useId()
  const name = displayName(user)

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <CircleUser className="size-5" aria-hidden="true" />
        <span className="hidden max-w-32 truncate sm:block">{user.firstName || user.email}</span>
        <ChevronDown className="size-4 text-white/60" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="space-y-0.5 px-2 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link to="/account" className={itemClass} onClick={close}>
            <UserRound className="size-4" aria-hidden="true" />
            My account
          </Link>
          {user.isStaff ? (
            <Link to="/admin" className={itemClass} onClick={close}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Admin
            </Link>
          ) : null}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className={itemClass}
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
