import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'apple-touch-icon-180x180.png'],
      // API calls go through the same origin (/api, proxied by Vercel); never answer them
      // with the cached app shell.
      // push-sw.js adds the reminder notification handlers to the generated worker.
      workbox: { navigateFallbackDenylist: [/^\/api\//], importScripts: ['push-sw.js'] },
      manifest: {
        name: 'OtterLang',
        short_name: 'OtterLang',
        description: 'Learn English from real content.',
        theme_color: '#f3eee5',
        background_color: '#f3eee5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Vitest blanks CSS by default; the contrast test reads the real design tokens.
    css: { include: [/index\.css/] },
  },
})
