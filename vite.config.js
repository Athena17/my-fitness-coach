import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Irada',
        short_name: 'Irada',
        description: 'Calorie & macro tracking PWA',
        display: 'standalone',
        background_color: '#0f1823',
        theme_color: '#0f1823',
        start_url: '/my-fitness-coach/',
        scope: '/my-fitness-coach/',
        icons: [
          { src: 'icons/icon-48.webp', sizes: '48x48', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-72.webp', sizes: '72x72', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-96.webp', sizes: '96x96', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-128.webp', sizes: '128x128', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-192.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-192.webp', sizes: '192x192', type: 'image/webp', purpose: 'maskable' },
          { src: 'icons/icon-256.webp', sizes: '256x256', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any' },
          { src: 'icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/my-fitness-coach/',
})
