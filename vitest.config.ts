import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      // Los tests de formularios largos con user-event superan los 5 s por
      // defecto cuando toda la suite corre en paralelo.
      testTimeout: 15000,
    },
  }),
)
