import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Em dev, /api é redirecionado para o backend FastAPI (evita CORS no dev local).
// Em produção, o frontend usa VITE_API_URL para apontar para a API remota.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
    },
  },
})
