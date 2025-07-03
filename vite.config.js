import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './frontend',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      external: [
        '@upstash/redis', 
        'xrpl', 
        'ioredis', 
        'redis',
        'bcryptjs',
        'jsonwebtoken',
        '@supabase/supabase-js',
        'crypto-js',
        'axios'
      ]
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

