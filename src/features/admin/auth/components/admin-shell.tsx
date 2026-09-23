import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/features/account/auth/hooks/use-sign-out'
import { displayName, type SessionUser } from '@/features/account/auth/types'
import { cn } from '@/lib/utils'

import { hasAdminPermission } from '../types'

type AdminShellProps = {
  user: SessionUser
  children: ReactNode
}

// Cada enlace se muestra solo con el permiso que exige su página.
const NAV_LINKS = [
  { to: '/admin/orders', label: 'Orders', permission: 'orders.view' },
  { to: '/admin/quotes', label: 'Quotes', permission: 'quotes.view' },
  { to: '/admin/customers', label: 'Customers', permission: 'customers.view' },
  { to: '/admin/activity', label: 'Activity', permission: 'activity.view' },
  { to: '/admin/users', label: 'Users', permission: 'users.manage' },
] as const

function navClass({ isActive }: { isActive: boolean }) {
  return cn('text-muted-foreground hover:text-foreground', isActive && 'text-foreground font-medium')
}

export function AdminShell({ user, children }: AdminShellProps) {
  const signOut = useSignOut('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link to="/admin" className="font-semibold">
              TorqueTrack Admin
            </Link>
            <p className="text-sm text-muted-foreground">{displayName(user)}</p>
          </div>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-4 text-sm">
            <NavLink to="/admin" end className={navClass}>
              Dashboard
            </NavLink>
            {NAV_LINKS.filter((link) => hasAdminPermission(user, link.permission)).map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Store
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              Sign out
            </Button>
          </nav>
        </div>
        <div className="px-6 pb-3 empty:hidden">
          <FormError error={signOut.error} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
