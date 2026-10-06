import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { AppShell } from '@/components/app-shell/app-shell'
import type { ShellNavGroup } from '@/components/app-shell/sidebar-nav'
import { usePageMeta } from '@/lib/page-meta'
import { ACCOUNT_NAV } from '@/features/account/portal/account-nav'
import { adminNavFor } from '@/features/admin/auth/admin-nav'

import { useSignOut } from '../hooks/use-sign-out'
import { displayName, homePathFor, type SessionUser } from '../types'

type PanelShellProps = {
  user: SessionUser
  children: ReactNode
  wide?: boolean
}

// Un solo panel para clientes y staff: la navegación sale de la sesión. El
// staff ve solo los grupos del panel filtrados por permiso, sin "My account",
// porque su perfil de cliente casi nunca existe.
// El título sale del enlace de la navegación con el prefijo más largo que
// coincide con la URL: `/admin/orders/O1` queda como "Orders".
function sectionTitle(groups: ShellNavGroup[], pathname: string): string | undefined {
  const items = groups.flatMap((group) => group.items)
  const match = items
    .filter((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return match?.label
}

export function PanelShell({ user, children, wide = false }: PanelShellProps) {
  const signOut = useSignOut(user.isStaff ? '/login' : '/')
  const { pathname } = useLocation()
  const groups = user.isStaff ? adminNavFor(user) : ACCOUNT_NAV
  const area = user.isStaff ? 'Admin' : 'My account'
  const section = sectionTitle(groups, pathname)
  // Panel y portal son privados: solo título y `noindex`, sin descripción.
  usePageMeta({ title: section ? `${section} · ${area}` : area, noindex: true })

  return (
    <AppShell
      navLabel={user.isStaff ? 'Admin' : 'Account'}
      homeHref={homePathFor(user)}
      area={area}
      groups={groups}
      user={{
        name: displayName(user),
        email: user.email,
        role: user.isStaff ? (user.role?.name ?? 'Staff') : 'Customer',
      }}
      onSignOut={() => signOut.mutate()}
      signingOut={signOut.isPending}
      signOutError={signOut.error}
      wide={wide}
    >
      {children}
    </AppShell>
  )
}
