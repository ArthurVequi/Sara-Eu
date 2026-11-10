import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    workbox: { importScripts: ['/push-worker.js'], globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] },
    manifest: {
      name: 'Organiza Aí',
      short_name: 'Organiza Aí',
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      theme_color: '#112c0f',
      background_color: '#ffffff',
      icons: [{ src: '/organiza.svg', sizes: 'any', type: 'image/svg+xml' }],
    },
  })],
})
