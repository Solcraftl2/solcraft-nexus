import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "buffer": "buffer"
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    include: ['xrpl', 'crypto-browserify', 'stream-browserify', 'buffer']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['crypto-browserify', 'stream-browserify', 'buffer'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  base: '/',
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
})

