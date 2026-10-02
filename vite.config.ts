import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Identidade do build. O app guarda a sua (import.meta.env.VITE_APP_VERSAO) e
// compara com /version.json, que é do deploy MAIS NOVO: se diferem, a aba está
// rodando código velho e o Painel Operacional pede para recarregar
// (lib/versaoApp.ts). Na Vercel usa o commit; fora dela, o instante do build.
const VERSAO = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || Date.now().toString(36)

function arquivoDeVersao(): Plugin {
  return {
    name: 'bmais-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ versao: VERSAO }) })
    },
  }
}

// https://vite.dev/config/
// Em dev, /api é redirecionado para o backend FastAPI (evita CORS no dev local).
// Em produção, o frontend usa VITE_API_URL para apontar para a API remota.
export default defineConfig({
  plugins: [react(), arquivoDeVersao()],
  define: {
    'import.meta.env.VITE_APP_VERSAO': JSON.stringify(VERSAO),
  },
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
