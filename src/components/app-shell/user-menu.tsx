import { ChevronDown, LogOut, Store } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'

export type ShellUser = {
  name: string
  email: string
  role: string
}

type UserMenuProps = {
  user: ShellUser
  onSignOut: () => void
  signingOut: boolean
}

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
  return letters.join('') || '?'
}

const itemClass =
  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none disabled:opacity-50'

// Patrón de disclosure (no `role="menu"`): los enlaces y botones del panel se
// recorren con Tab como cualquier otro control.
export function UserMenu({ user, onSignOut, signingOut }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {initials(user.name)}
        </span>
        <span className="hidden max-w-40 truncate font-medium sm:block">{user.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="space-y-1 px-2 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" data-role-badge="">
              {user.role}
            </Badge>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link to="/" className={itemClass} onClick={() => setOpen(false)}>
            <Store className="size-4" aria-hidden="true" />
            Back to store
          </Link>
          <button type="button" className={itemClass} onClick={onSignOut} disabled={signingOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
