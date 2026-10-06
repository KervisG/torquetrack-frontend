import type { ComponentType } from 'react'
import { Navigate } from 'react-router-dom'

import { PageViewTracker } from '@/components/page-view-tracker'
import { StorefrontShell } from '@/components/storefront-shell'
import { AccountAuthGuard } from '@/features/account/auth/components/account-auth-guard'
import { GuestGuard } from '@/features/account/auth/components/guest-guard'
import { SessionLoading } from '@/features/account/auth/components/session-loading'
import { ActivatePage } from '@/features/account/auth/pages/activate-page'
import { ForgotPasswordPage } from '@/features/account/auth/pages/forgot-password-page'
import { LoginPage } from '@/features/account/auth/pages/login-page'
import { RegisterPage } from '@/features/account/auth/pages/register-page'
import { ResetPasswordPage } from '@/features/account/auth/pages/reset-password-page'
import { VerifyEmailPage } from '@/features/account/auth/pages/verify-email-page'
import { CatalogPage } from '@/features/storefront/catalog/pages/catalog-page'
import { CheckoutPage } from '@/features/storefront/checkout/pages/checkout-page'
import { CheckoutSuccessPage } from '@/features/storefront/checkout/pages/checkout-success-page'
import { NotFoundPage } from '@/features/storefront/errors/pages/not-found-page'
import { RouteErrorPage } from '@/features/storefront/errors/pages/route-error-page'
import { PoliciesPage } from '@/features/storefront/policies/pages/policies-page'
import { PrivacyPolicyPage } from '@/features/storefront/policies/pages/privacy-policy-page'
import { ReturnsPolicyPage } from '@/features/storefront/policies/pages/returns-policy-page'
import { ShippingPolicyPage } from '@/features/storefront/policies/pages/shipping-policy-page'
import { TermsPage } from '@/features/storefront/policies/pages/terms-page'
import { ProductPage } from '@/features/storefront/product/pages/product-page'
import { PublicQuotePage } from '@/features/storefront/quote/pages/public-quote-page'
import { RequestQuotePage } from '@/features/storefront/quote/pages/request-quote-page'

// El panel y el portal se cargan bajo demanda para que el bundle del
// storefront no los incluya. `HydrateFallback` tiene que ser estático: se ve
// mientras carga el módulo cuando la ruta lazy es la primera que se abre.
function lazyPage<M extends Record<K, ComponentType>, K extends string>(
  load: () => Promise<M>,
  name: K,
) {
  return { HydrateFallback: SessionLoading, lazy: async () => ({ Component: (await load())[name] }) }
}

export const appRoutes = [
  {
    // Ruta raíz sin path: su errorElement atrapa lo que falle en cualquier
    // página, incluso la carga de una ruta lazy.
    errorElement: <RouteErrorPage />,
    element: <PageViewTracker />,
    children: [
      {
        element: <StorefrontShell />,
        children: [
          { path: '/', element: <CatalogPage /> },
          // Acepta el slug (el que enlaza la tienda) o el id de los enlaces viejos.
          { path: '/product/:idOrSlug', element: <ProductPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
          // Destino de los correos de carrito abandonado: el checkout ya lista
          // las líneas del carrito, que se lee del backend al montar la tienda.
          { path: '/cart', element: <Navigate to="/checkout" replace /> },
          { path: '/checkout-success', element: <CheckoutSuccessPage /> },
          { path: '/quote', element: <RequestQuotePage /> },
          // Enlace del correo de la cotización: el token es el único control de
          // acceso, así que no exige sesión.
          { path: '/quote/:token', element: <PublicQuotePage /> },
          { path: '/policies', element: <PoliciesPage /> },
          { path: '/policies/shipping', element: <ShippingPolicyPage /> },
          { path: '/policies/returns', element: <ReturnsPolicyPage /> },
          { path: '/policies/privacy', element: <PrivacyPolicyPage /> },
          { path: '/policies/terms', element: <TermsPage /> },
          // Cualquier URL que no coincide con otra ruta cae acá, con el header
          // de la tienda.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '/account',
        element: <AccountAuthGuard />,
        children: [
          {
            ...lazyPage(() => import('@/features/account/portal/components/portal-layout'), 'PortalLayout'),
            children: [
              // `/account` y los enlaces viejos `/account?tab=` van a su sección.
              { index: true, ...lazyPage(() => import('@/features/account/portal/components/portal-tab-redirect'), 'PortalTabRedirect') },
              { path: 'profile', ...lazyPage(() => import('@/features/account/portal/pages/portal-profile-page'), 'PortalProfilePage') },
              { path: 'orders', ...lazyPage(() => import('@/features/account/portal/pages/portal-orders-page'), 'PortalOrdersPage') },
              { path: 'quotes', ...lazyPage(() => import('@/features/account/portal/pages/portal-quotes-page'), 'PortalQuotesPage') },
              { path: 'tax-exemption', ...lazyPage(() => import('@/features/account/portal/pages/portal-tax-exemption-page'), 'PortalTaxExemptionPage') },
            ],
          },
        ],
      },
      {
        element: <GuestGuard />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      // Fuera del GuestGuard: un enlace del correo (invitación, reset o
      // verificación) abierto con otra sesión igual tiene que poder usarse.
      { path: '/activate', element: <ActivatePage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      // Enlace viejo del login de empleados: ahora hay un solo login.
      { path: '/admin/login', element: <Navigate to="/login" replace /> },
      {
        path: '/admin',
        ...lazyPage(() => import('@/features/admin/auth/components/admin-auth-guard'), 'AdminAuthGuard'),
        children: [
          { index: true, ...lazyPage(() => import('@/features/admin/dashboard/pages/dashboard-page'), 'DashboardPage') },
          { path: 'users', ...lazyPage(() => import('@/features/admin/users/pages/users-page'), 'UsersPage') },
          { path: 'customers', ...lazyPage(() => import('@/features/admin/customers/pages/customers-page'), 'CustomersPage') },
          { path: 'customers/:id', ...lazyPage(() => import('@/features/admin/customers/pages/customer-detail-page'), 'CustomerDetailPage') },
          { path: 'orders', ...lazyPage(() => import('@/features/admin/orders/pages/orders-page'), 'OrdersPage') },
          { path: 'orders/:id', ...lazyPage(() => import('@/features/admin/orders/pages/order-detail-page'), 'OrderDetailPage') },
          { path: 'products', ...lazyPage(() => import('@/features/admin/products/pages/products-page'), 'ProductsPage') },
          { path: 'carts', ...lazyPage(() => import('@/features/admin/carts/pages/carts-page'), 'CartsPage') },
          { path: 'carts/:id', ...lazyPage(() => import('@/features/admin/carts/pages/cart-detail-page'), 'CartDetailPage') },
          { path: 'quotes', ...lazyPage(() => import('@/features/admin/quotes/pages/quotes-page'), 'QuotesPage') },
          { path: 'quotes/new', ...lazyPage(() => import('@/features/admin/quotes/pages/quote-editor-page'), 'QuoteEditorPage') },
          { path: 'quotes/:id', ...lazyPage(() => import('@/features/admin/quotes/pages/quote-detail-page'), 'QuoteDetailPage') },
          { path: 'quotes/:id/edit', ...lazyPage(() => import('@/features/admin/quotes/pages/quote-editor-page'), 'QuoteEditorPage') },
          { path: 'activity', ...lazyPage(() => import('@/features/admin/activity/pages/activity-page'), 'ActivityPage') },
        ],
      },
    ],
  },
]
