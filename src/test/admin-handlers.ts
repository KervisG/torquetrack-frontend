import { http, HttpResponse } from 'msw'

export const sessionUser = {
  id: 'usr_1',
  email: 'ada@example.com',
  username: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Diesel',
  name: 'Ada Diesel',
  role: 'admin',
  permissions: ['*'],
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
  return http.get('/api/admin/session/', () =>
    HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  )
}

export function authenticatedSession() {
  return http.get('/api/admin/session/', () =>
    HttpResponse.json({ authenticated: true, user: sessionUser }),
  )
}

export function dashboardOk() {
  return http.get('/api/admin/dashboard/', () =>
    HttpResponse.json({ counts: dashboardCounts }),
  )
}
