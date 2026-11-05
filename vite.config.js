import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { seoFilesPlugin } from './scripts/seo-files-plugin.js'

export default defineConfig({
  plugins: [react(), seoFilesPlugin()],
  build: {
    target: 'es2018',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
