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
      ],
      "shortcuts": [
        {
          "name": "New Manual Recipe",
          "short_name": "New Manual Recipe",
          "description": "Create a new recipe manually",
          "url": "/#/recipe/0/edit?fromShortcut=1",
          "icons": [{ "src": "/shortcut-add-manual.png", "sizes": "192x192" }]
        },
        {
          "name": "Import From URL",
          "short_name": "New Recipe",
          "description": "Create a new recipe from a URL",
          "url": "/#/recipe/0/edit?import=1&fromShortcut=1",
          "icons": [{ "src": "/shortcut-add-url.png", "sizes": "192x192" }]
        },
        {
          "name": "Scan a Recipe",
          "short_name": "New Recipe",
          "description": "Create a new recipe by scanning from an image",
          "url": "/#/recipe/import-ocr?fromShortcut=1",
          "icons": [{ "src": "/shortcut-add-scan.png", "sizes": "192x192" }]
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