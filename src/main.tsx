import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/design-system.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { aoFalharCarregamento } from './lib/versaoApp'

// Um pedaço da tela que não carrega depois de um deploy (o arquivo da versão
// velha já não existe): recarrega para a versão nova em vez de deixar a tela em
// branco, se não houver trabalho aberto. Ver lib/versaoApp.ts.
window.addEventListener('vite:preloadError', (e) => {
  if (aoFalharCarregamento()) e.preventDefault()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Sem staleTime o React Query considera todo dado "velho" na hora e refaz o
      // request a cada navegação — causando o "pisca" e recarregamento ao trocar
      // de tela. 60s deixa os dados servidos do cache instantaneamente ao renavegar.
      staleTime: 60_000,
      // Mantém o dado em cache por 5 min após a tela desmontar, para voltar sem refetch.
      gcTime: 5 * 60_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
