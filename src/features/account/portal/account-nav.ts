import { FileText, Package, Receipt, UserRound } from 'lucide-react'

import type { ShellNavGroup } from '@/components/app-shell/sidebar-nav'

export const ACCOUNT_NAV: ShellNavGroup[] = [
  {
    label: 'My account',
    items: [
      { to: '/account/profile', label: 'Profile', icon: UserRound },
      { to: '/account/orders', label: 'Orders', icon: Package },
      { to: '/account/quotes', label: 'Quotes', icon: FileText },
      { to: '/account/tax-exemption', label: 'Tax exemption', icon: Receipt },
    ],
  },
]
