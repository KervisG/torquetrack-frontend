import { Activity, FileText, LayoutDashboard, Package, ShoppingBag, ShoppingCart, UserCog, Users } from 'lucide-react'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import type { ShellNavGroup, ShellNavItem } from '@/components/app-shell/sidebar-nav'
import { useSignOut } from '@/features/account/auth/hooks/use-sign-out'
import { displayName, type SessionUser } from '@/features/account/auth/types'

import { hasAdminPermission } from '../types'

type AdminShellProps = {
  user: SessionUser
  children: ReactNode
}

type AdminNavItem = ShellNavItem & { permission?: string }

// Cada enlace se muestra solo con el permiso que exige su página. El
// dashboard queda siempre: sin permiso muestra el aviso en lugar del 404.
const NAV_GROUPS: { label: string; items: AdminNavItem[] }[] = [
  { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: 'orders.view' },
      { to: '/admin/quotes', label: 'Quotes', icon: FileText, permission: 'quotes.view' },
      { to: '/admin/carts', label: 'Carts', icon: ShoppingBag, permission: 'carts.view' },
      { to: '/admin/customers', label: 'Customers', icon: Users, permission: 'customers.view' },
    ],
  },
  {
    label: 'Catalog',
    items: [{ to: '/admin/products', label: 'Products', icon: Package, permission: 'products.view' }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserCog, permission: 'users.manage' },
      { to: '/admin/activity', label: 'Activity', icon: Activity, permission: 'activity.view' },
    ],
  },
]

function navFor(user: SessionUser): ShellNavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => !item.permission || hasAdminPermission(user, item.permission)),
  })).filter((group) => group.items.length > 0)
}

export function AdminShell({ user, children }: AdminShellProps) {
  const signOut = useSignOut('/login')

  return (
    <AppShell
      navLabel="Admin"
      homeHref="/admin"
      area="Admin"
      groups={navFor(user)}
      user={{ name: displayName(user), email: user.email, role: user.role?.name ?? 'Staff' }}
      onSignOut={() => signOut.mutate()}
      signingOut={signOut.isPending}
      signOutError={signOut.error}
      wide
    >
      {children}
    </AppShell>
  )
}
