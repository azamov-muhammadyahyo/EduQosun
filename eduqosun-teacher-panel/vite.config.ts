import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // recharts kutubxonasining o'zi ~500 kB — bu chegara faqat shu vendor bo'lagi uchun
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Katta kutubxonalarni alohida "vendor" bo'laklarga ajratamiz
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
