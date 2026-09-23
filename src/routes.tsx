import { Navigate } from 'react-router-dom'

import { StorefrontShell } from '@/components/storefront-shell'
import { AccountAuthGuard } from '@/features/account/auth/components/account-auth-guard'
import { GuestGuard } from '@/features/account/auth/components/guest-guard'
import { ActivatePage } from '@/features/account/auth/pages/activate-page'
import { ForgotPasswordPage } from '@/features/account/auth/pages/forgot-password-page'
import { LoginPage } from '@/features/account/auth/pages/login-page'
import { RegisterPage } from '@/features/account/auth/pages/register-page'
import { ResetPasswordPage } from '@/features/account/auth/pages/reset-password-page'
import { VerifyEmailPage } from '@/features/account/auth/pages/verify-email-page'
import { PortalPage } from '@/features/account/portal/pages/portal-page'
import { ActivityPage } from '@/features/admin/activity/pages/activity-page'
import { AdminAuthGuard } from '@/features/admin/auth/components/admin-auth-guard'
import { CustomerDetailPage } from '@/features/admin/customers/pages/customer-detail-page'
import { CustomersPage } from '@/features/admin/customers/pages/customers-page'
import { DashboardPage } from '@/features/admin/dashboard/pages/dashboard-page'
import { OrderDetailPage } from '@/features/admin/orders/pages/order-detail-page'
import { OrdersPage } from '@/features/admin/orders/pages/orders-page'
import { QuoteDetailPage } from '@/features/admin/quotes/pages/quote-detail-page'
import { QuoteEditorPage } from '@/features/admin/quotes/pages/quote-editor-page'
import { QuotesPage } from '@/features/admin/quotes/pages/quotes-page'
import { UsersPage } from '@/features/admin/users/pages/users-page'
import { CatalogPage } from '@/features/storefront/catalog/pages/catalog-page'
import { CheckoutPage } from '@/features/storefront/checkout/pages/checkout-page'
import { CheckoutSuccessPage } from '@/features/storefront/checkout/pages/checkout-success-page'
import { ProductPage } from '@/features/storefront/product/pages/product-page'
import { PublicQuotePage } from '@/features/storefront/quote/pages/public-quote-page'
import { RequestQuotePage } from '@/features/storefront/quote/pages/request-quote-page'

export const appRoutes = [
  {
    element: <StorefrontShell />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/product/:id', element: <ProductPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/checkout-success', element: <CheckoutSuccessPage /> },
      { path: '/quote', element: <RequestQuotePage /> },
      // Enlace del correo de la cotización: el token es el único control de
      // acceso, así que no exige sesión.
      { path: '/quote/:token', element: <PublicQuotePage /> },
      {
        element: <AccountAuthGuard />,
        children: [{ path: '/account', element: <PortalPage /> }],
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
    element: <AdminAuthGuard />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'quotes/new', element: <QuoteEditorPage /> },
      { path: 'quotes/:id', element: <QuoteDetailPage /> },
      { path: 'quotes/:id/edit', element: <QuoteEditorPage /> },
      { path: 'activity', element: <ActivityPage /> },
    ],
  },
]
