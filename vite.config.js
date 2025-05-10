import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'service-worker': resolve(__dirname, 'public/service-worker.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'service-worker' 
            ? 'service-worker.js' 
            : 'assets/[name]-[hash].js'
        }
      }
    }
  }
}) 