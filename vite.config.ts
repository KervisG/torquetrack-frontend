import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        // Las dependencias cambian menos que el código de la app: en chunks
        // propios el navegador las conserva en cache entre deploys. React y el
        // router van aparte para que ningún chunk supere los 500 kB.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/]\.pnpm[\\/](react|react-dom|react-router|scheduler)@/,
              priority: 2,
            },
            { name: 'vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    // Docker publica Django en el host como 8010 (ver backend/docker-compose.yml).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8010',
        changeOrigin: true,
      },
    },
  },
})
