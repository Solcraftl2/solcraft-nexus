import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Specifica la directory root del frontend
  root: './',
  
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Configurazione build
  build: {
    // Output nella directory dist della root del progetto
    outDir: './dist',
    // Pulisce la directory di output prima del build
    emptyOutDir: true,
    // Configurazione per ottimizzazione
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        }
      }
    }
  },
  
  // Configurazione server per sviluppo
  server: {
    port: 3000,
    open: true
  },
  
  // Configurazione preview
  preview: {
    port: 4173
  }
})

