import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Specifica la directory root del frontend
  // Aggiornato per indicare la root del progetto
  root: './',
  
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      // Alias per l'importazione dei moduli dal frontend
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

