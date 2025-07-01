import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Use the frontend directory as the project root
  root: './frontend',
  resolve: {
    alias: {
      // Alias to the src folder inside the frontend directory
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
  build: {
    // Place the build output in the project root dist folder
    outDir: '../dist',
    rollupOptions: {
      external: ['@upstash/redis', 'xrpl', 'ioredis', 'redis']
    }
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
})

