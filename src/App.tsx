import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Login from './pages/Login'

// Páginas carregadas sob demanda (code-splitting). Diretoria e Gestor arrastam
// o Chart.js — mantê-las em lazy tira essa lib do bundle inicial.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Diretoria = lazy(() => import('./pages/Diretoria'))
const Gestor = lazy(() => import('./pages/Gestor'))
const Equipe = lazy(() => import('./pages/Equipe'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const Upload = lazy(() => import('./pages/Upload'))

function PageFallback() {
  return (
    <div className="empty-state" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      Carregando…
    </div>
  )
}

function ProtectedRoutes() {
  const { authenticated, loading } = useAuth()

  if (loading) {
    return <PageFallback />
  }
  if (!authenticated) {
    return <Login />
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/diretoria" element={<Diretoria />} />
        <Route path="/gestor" element={<Gestor />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedRoutes />
    </BrowserRouter>
  )
}
