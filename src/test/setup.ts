import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { clearCsrfToken } from '@/lib/api-client'

import { server } from './msw-server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// El token CSRF vive en memoria del módulo; sin limpiarlo se filtra entre tests.
afterEach(() => {
  server.resetHandlers()
  clearCsrfToken()
})
afterAll(() => server.close())
