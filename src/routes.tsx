import { StorefrontShell } from '@/components/storefront-shell'
import { AdminAuthGuard } from '@/features/admin/auth/components/admin-auth-guard'
import { AdminGuestGuard } from '@/features/admin/auth/components/admin-guest-guard'
import { LoginPage } from '@/features/admin/auth/pages/login-page'
import { DashboardPage } from '@/features/admin/dashboard/pages/dashboard-page'
import { CatalogPage } from '@/features/storefront/catalog/pages/catalog-page'
import { CheckoutPage } from '@/features/storefront/checkout/pages/checkout-page'
import { CheckoutSuccessPage } from '@/features/storefront/checkout/pages/checkout-success-page'
import { ProductPage } from '@/features/storefront/product/pages/product-page'

export const appRoutes = [
  {
    element: <StorefrontShell />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/product/:id', element: <ProductPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/checkout-success', element: <CheckoutSuccessPage /> },
    ],
  },
  {
    element: <AdminGuestGuard />,
    children: [
      { path: '/admin/login', element: <LoginPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminAuthGuard />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
]
