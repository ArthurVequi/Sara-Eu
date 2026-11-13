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
      theme_color: '#edf4e9',
      background_color: '#edf4e9',
      icons: [
        { src: '/organiza-ai-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/organiza-ai-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  })],
})
