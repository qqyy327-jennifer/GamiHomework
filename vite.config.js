import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages 部署時改為 '/GamiHomework/'（對應 repo 名稱）
  // 若部署到自訂網域根目錄則改回 '/'
  base: process.env.NODE_ENV === 'production' ? '/GamiHomework/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '馬力歐作業闖關',
        short_name: '作業闖關',
        description: '用星星打敗作業魔王！',
        theme_color: '#E52521',
        background_color: '#FBBF24',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
