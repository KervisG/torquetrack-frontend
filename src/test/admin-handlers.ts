import { http, HttpResponse } from 'msw'

import type { SessionUser } from '@/features/admin/auth/types'

export const sessionUser: SessionUser = {
  id: 'usr_1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Diesel',
  isStaff: true,
  role: { slug: 'admin', name: 'Admin', fullAccess: true },
  permissions: ['dashboard.view', 'users.manage'],
}

export const customerUser: SessionUser = {
  id: 'usr_2',
  email: 'pat@example.com',
  firstName: 'Pat',
  lastName: 'Fleet',
  isStaff: false,
  role: null,
  permissions: [],
}

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
    HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  )
}

export function authenticatedSession(user: SessionUser = sessionUser) {
  return http.get('/api/session/', () =>
    HttpResponse.json({ authenticated: true, user }),
  )
}

export function dashboardOk() {
  return http.get('/api/admin/dashboard/', () =>
    HttpResponse.json({ counts: dashboardCounts }),
  )
}
