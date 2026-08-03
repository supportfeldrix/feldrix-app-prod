import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { renameSync, existsSync } from 'fs'

/**
 * Renames index-admin.html → index.html in the dist folder after build.
 * This ensures both farmer and admin deployments output dist/index.html.
 */
function renameAdminHtml() {
  return {
    name: 'rename-admin-html',
    closeBundle() {
      const src = resolve(__dirname, 'dist/index-admin.html');
      const dest = resolve(__dirname, 'dist/index.html');
      if (existsSync(src)) {
        renameSync(src, dest);
      }
    },
  };
}

/**
 * ============================================================
 * Feldrix — Dual Deployment Vite Configuration
 * Sprint 46.4
 *
 * VITE_APP_MODE controls which app is built:
 *   "farmer" (default) → app.feldrix.com
 *   "admin"            → admin.feldrix.com
 *
 * Usage:
 *   VITE_APP_MODE=farmer npx vite build   (or just: npx vite build)
 *   VITE_APP_MODE=admin npx vite build
 * ============================================================
 */

const mode = process.env.VITE_APP_MODE || 'farmer';
const isAdmin = mode === 'admin';

// PWA config — only for farmer app (admin doesn't need installability)
const pwaConfig = isAdmin ? [] : [
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: [
      'branding/favicon.ico',
      'icons/apple-touch-icon.png',
      'favicon.svg',
    ],
    manifest: {
      name: 'Feldrix',
      short_name: 'Feldrix',
      description: 'Smart Farm Management Platform — livestock, crops, machinery, finance and planning.',
      theme_color: '#1f6f43',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      categories: ['business', 'productivity'],
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      globIgnores: ['**/branding/login/**', '**/branding/report-cover.png'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: { cacheName: 'supabase-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, cacheableResponse: { statuses: [0, 200] } },
        },
      ],
    },
  }),
];

export default defineConfig({
  plugins: [react(), ...pwaConfig, ...(isAdmin ? [renameAdminHtml()] : [])],
  define: {
    'import.meta.env.VITE_APP_MODE': JSON.stringify(mode),
  },
  build: {
    rollupOptions: {
      input: isAdmin
        ? resolve(__dirname, 'index-admin.html')
        : resolve(__dirname, 'index.html'),
    },
    outDir: 'dist',
  },
})
