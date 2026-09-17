import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Katta kutubxonalarni alohida "vendor" bo'laklarga ajratamiz — brauzer ularni uzoq keshlaydi */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
  if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'icons'
  // recharts va uning d3/lodash bog'liqliklari faqat grafikli sahifalarda yuklanadi
  return 'charts'
}

/** Telegram serveri (eduqosun-server) — /api so'rovlari shu yerga uzatiladi */
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:4000',
    // Katta fayllar va SSE oqimi uchun vaqt cheklovi yo'q
    timeout: 0,
    proxyTimeout: 0,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    // recharts kutubxonasining o'zi ~500 kB — bu chegara faqat shu vendor bo'lagi uchun
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
