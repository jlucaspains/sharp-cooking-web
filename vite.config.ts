import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Pages from 'vite-plugin-pages'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), VitePWA({
    base: '/',
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    devOptions: {
      enabled: true
      /* other options */  
    },
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sharp Cooking',
      short_name: 'Sharp Cooking',
      description: 'Your recipe book app',
      theme_color: '#ffffff',
      scope: '.',
      icons: [
        {
          src: 'android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }
      ]
    }
  }),
  Pages({
    extendRoute(route, parent) {
      return {
        ...route,
        meta: { title: "" },
      }
    },
  })],
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
      'util': "./src/util.js"
    }
  }
})