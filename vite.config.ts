/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Keep the API base URL defined so client.ts's load-time guard passes.
    env: { VITE_API_BASE_URL: '/api' },
  },
  server: {
    // Serve the API same-origin in dev so the server's HttpOnly auth cookies
    // are first-party and survive reloads. Production should mirror this by
    // serving the API from the same site (or a path behind the same domain).
    proxy: {
      '/api': {
        target: 'https://dummyjson.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
