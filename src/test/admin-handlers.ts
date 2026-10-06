import { http, HttpResponse } from 'msw'

import type { SessionUser } from '@/features/account/auth/types'

export const sessionUser: SessionUser = {
  id: 'usr_1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Diesel',
  isStaff: true,
  role: { slug: 'admin', name: 'Admin', fullAccess: true },
  permissions: ['dashboard.view', 'users.manage'],
  emailVerified: true,
}

export const customerUser: SessionUser = {
  id: 'usr_2',
  email: 'pat@example.com',
  firstName: 'Pat',
  lastName: 'Fleet',
  isStaff: false,
  role: null,
  permissions: [],
  emailVerified: true,
}

export const testCsrfToken = 'csrf-test-token'

export const dashboardCounts = {
  orders: 3,
  activeQuotes: 1,
  buildingQuotes: 0,
  activeCarts: 2,
  abandonedCarts: 4,
  salesToday: 12.5,
}

export function unauthorizedSession() {
  return http.get('/api/session/', () =>
    HttpResponse.json({ error: 'Unauthorized', csrfToken: testCsrfToken }, { status: 401 }),
  )
}

export function authenticatedSession(user: SessionUser = sessionUser) {
  return http.get('/api/session/', () =>
    HttpResponse.json({ authenticated: true, user, csrfToken: testCsrfToken }),
  )
}

export function dashboardOk() {
  return http.get('/api/admin/dashboard/', () =>
    HttpResponse.json({ counts: dashboardCounts }),
  )
}

// Sin "3" ni "$12.50" sueltos: los tests de los conteos buscan esos textos exactos.
export const dashboardAnalytics = {
  range: '30d',
  granularity: 'day',
  timeZone: 'UTC',
  start: '2026-09-05',
  end: '2026-10-04',
  revenueSeries: [
    { date: '2026-10-03', revenue: 0, orders: 0 },
    { date: '2026-10-04', revenue: 1250, orders: 2 },
  ],
  kpis: {
    revenue: { value: 1250, previous: 625, changePercent: 100 },
    orders: { value: 2, previous: 1, changePercent: 100 },
    averageOrderValue: { value: 625, previous: 625, changePercent: 0 },
    refunds: { value: 40, previous: 0, changePercent: null },
  },
  ordersByStatus: [
    { status: 'OPEN', count: 2 },
    { status: 'SHIPPED', count: 0 },
  ],
  topProducts: [
    { productId: 'pump', title: 'CP3 Pump', partNumber: '0445020150', units: 2, revenue: 1000 },
  ],
  quoteFunnel: { created: 5, sent: 4, converted: 2, conversionRate: 40 },
  cartFunnel: { created: 6, checkoutStarted: 4, converted: 2, abandoned: 2 },
}

export function dashboardAnalyticsOk() {
  return http.get('/api/admin/dashboard/analytics/', () => HttpResponse.json(dashboardAnalytics))
}
