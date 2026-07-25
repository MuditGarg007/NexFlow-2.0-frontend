import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the animation and markdown libraries out of the entry chunk so the
        // landing page paints without waiting on code only the chat screens use.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion', 'gsap'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
})
