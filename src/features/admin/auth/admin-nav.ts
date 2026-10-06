import { Activity, FileText, LayoutDashboard, Package, ShoppingBag, ShoppingCart, UserCog, Users } from 'lucide-react'

import type { ShellNavGroup, ShellNavItem } from '@/components/app-shell/sidebar-nav'
import type { SessionUser } from '@/features/account/auth/types'

import { hasAdminPermission } from './types'

type AdminNavItem = ShellNavItem & { permission?: string }

// Cada enlace se muestra solo con el permiso que exige su página. El
// dashboard queda siempre: sin permiso muestra el aviso en lugar del 404.
const ADMIN_NAV: { label: string; items: AdminNavItem[] }[] = [
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

export function adminNavFor(user: SessionUser): ShellNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => !item.permission || hasAdminPermission(user, item.permission)),
  })).filter((group) => group.items.length > 0)
}
