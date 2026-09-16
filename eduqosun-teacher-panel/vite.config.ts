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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
