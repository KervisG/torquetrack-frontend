import { ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
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
  // En la cabecera va el nombre (o la parte local del correo) y un avatar con
  // iniciales; el correo completo vive en el desplegable y en el tooltip.
  const shortName = user.firstName.trim() || user.email.split('@')[0] || user.email

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        className="group flex h-10 items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-2 text-left text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 aria-expanded:bg-white/10"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-semibold uppercase text-neutral-950 ring-2 ring-white/15 transition group-hover:ring-amber-400/60"
        >
          {initials(user)}
        </span>
        {/* Saludo + "My account": deja claro que ahí está la cuenta. */}
        <span className="hidden flex-col leading-tight md:flex" title={user.email}>
          <span className="text-[11px] text-white/60">Hi, {shortName}</span>
          <span className="max-w-36 truncate text-sm font-medium">My account</span>
        </span>
        <ChevronDown
          className="size-4 text-white/60 transition-transform group-aria-expanded:rotate-180"
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="space-y-0.5 px-2 py-2">
            <p className="break-words text-sm font-medium">{name}</p>
            <p className="break-all text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </p>
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

function initials(user: SessionUser): string {
  const fromName = [user.firstName, user.lastName]
    .map((part) => part.trim().charAt(0))
    .join('')
  return fromName || user.email.charAt(0) || '?'
}
