import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": "/src", // Maps @ to /src
    },
  },
  server: {
    host: true, // Exposes server to all network interfaces
  },
})