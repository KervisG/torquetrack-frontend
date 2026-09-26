import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { clearCsrfToken } from '@/lib/api-client'

import { server } from './msw-server'

// jsdom no trae ResizeObserver. La barra de precio de Radix lo usa al medir el pulgar.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Las rutas del panel y del portal son lazy: la primera vez que un test las
// abre, Vitest transforma el módulo en frío y con la suite en paralelo eso
// supera el segundo por defecto de `findBy*`.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// El token CSRF vive en memoria del módulo; sin limpiarlo se filtra entre tests.
afterEach(() => {
  server.resetHandlers()
  clearCsrfToken()
})
afterAll(() => server.close())
