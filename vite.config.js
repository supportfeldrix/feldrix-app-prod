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
    // Single service worker: our custom sw-weather.js provides BOTH the PWA
    // precache (via injectManifest) AND weather push handling. This avoids a
    // second competing Workbox-generated SW at scope "/".
    strategies: 'injectManifest',
    srcDir: 'public',
    filename: 'sw-weather.js',
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,ico,svg,png,woff,woff2}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      globIgnores: ['**/branding/login/**', '**/branding/report-cover.png'],
    },
    includeAssets: [
      'branding/feldrix-farmer-icon.svg',
      'icons/farmer/apple-touch-icon.png',
      'icons/farmer/favicon-32x32.png',
      'icons/farmer/icon-192x192.png',
      'icons/farmer/icon-512x512.png',
      'branding/feldrix-logo-green.png',
      'branding/feldrix-logo-white.png',
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
        { src: '/icons/farmer/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/farmer/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/farmer/icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { src: '/icons/farmer/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/farmer/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        { src: '/icons/farmer/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/farmer/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
