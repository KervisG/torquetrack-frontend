import type { ComponentType } from 'react'
import { matchRoutes, type RouteObject } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PortalTabRedirect } from '@/features/account/portal/components/portal-tab-redirect'
import { ActivityPage } from '@/features/admin/activity/pages/activity-page'
import { AdminAuthGuard } from '@/features/admin/auth/components/admin-auth-guard'
import { CustomerDetailPage } from '@/features/admin/customers/pages/customer-detail-page'
import { CustomersPage } from '@/features/admin/customers/pages/customers-page'
import { DashboardPage } from '@/features/admin/dashboard/pages/dashboard-page'
import { OrderDetailPage } from '@/features/admin/orders/pages/order-detail-page'
import { CartDetailPage } from '@/features/admin/carts/pages/cart-detail-page'
import { CartsPage } from '@/features/admin/carts/pages/carts-page'
import { OrdersPage } from '@/features/admin/orders/pages/orders-page'
import { ProductsPage } from '@/features/admin/products/pages/products-page'
import { QuoteDetailPage } from '@/features/admin/quotes/pages/quote-detail-page'
import { QuoteEditorPage } from '@/features/admin/quotes/pages/quote-editor-page'
import { QuotesPage } from '@/features/admin/quotes/pages/quotes-page'
import { UsersPage } from '@/features/admin/users/pages/users-page'

import { appRoutes } from './routes'

// Las rutas lazy no fallan al compilar si apuntan al módulo equivocado: este
// test resuelve cada URL y compara el componente que carga.
const lazyPages: [string, ComponentType][] = [
  ['/account', PortalTabRedirect],
  ['/admin', DashboardPage],
  ['/admin/users', UsersPage],
  ['/admin/customers', CustomersPage],
  ['/admin/customers/C1', CustomerDetailPage],
  ['/admin/orders', OrdersPage],
  ['/admin/products', ProductsPage],
  ['/admin/carts', CartsPage],
  ['/admin/carts/C1', CartDetailPage],
  ['/admin/orders/O1', OrderDetailPage],
  ['/admin/quotes', QuotesPage],
  ['/admin/quotes/new', QuoteEditorPage],
  ['/admin/quotes/Q1', QuoteDetailPage],
  ['/admin/quotes/Q1/edit', QuoteEditorPage],
  ['/admin/activity', ActivityPage],
]

async function loadComponent(route: RouteObject) {
  if (typeof route.lazy !== 'function') throw new Error(`${route.path} is not lazy`)
  return (await route.lazy()).Component
}

describe('appRoutes', () => {
  it.each(lazyPages)('%s lazily loads its page', async (path, page) => {
    const matches = matchRoutes(appRoutes, path)

    expect(matches).not.toBeNull()
    expect(await loadComponent(matches!.at(-1)!.route)).toBe(page)
  })

  it('keeps every admin page behind the lazy admin guard', async () => {
    const [guard] = matchRoutes(appRoutes, '/admin/users')!

    expect(await loadComponent(guard.route)).toBe(AdminAuthGuard)
  })
})
