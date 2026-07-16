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
  build: {
    rollupOptions: {
      output: {
        // Separa dependências pesadas em chunks próprios e estáveis (API de
        // code-splitting do Rolldown, que substitui o manualChunks-objeto do Rollup):
        //  - charts: Chart.js só é baixado ao abrir Diretoria/Gestor (telas lazy).
        //  - vendor: React/Router/Query mudam pouco → melhor cache entre deploys.
        codeSplitting: {
          groups: [
            { name: 'charts', test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|@kurkle)[\\/]/ },
            { name: 'vendor', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@tanstack)[\\/]/ },
          ],
        },
      },
    },
  },
})
