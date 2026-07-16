import { lazy, Suspense, useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { podeVer, ROTA_FALLBACK } from './auth/permissions'
import type { Screen } from './auth/permissions'
import Login from './pages/Login'
import { LoadingState } from './components/ui'
import {
  importDashboard, importDiretoria, importGestor,
  importEquipe, importConfiguracoes, importUpload,
} from './routes'

// Páginas carregadas sob demanda (code-splitting). Diretoria e Gestor arrastam
// o Chart.js — mantê-las em lazy tira essa lib do bundle inicial. Os import()
// vêm de ./routes para a Sidebar poder pré-carregá-los no hover (mesmo chunk).
const Dashboard = lazy(importDashboard)
const Diretoria = lazy(importDiretoria)
const Gestor = lazy(importGestor)
const Equipe = lazy(importEquipe)
const Configuracoes = lazy(importConfiguracoes)
const Upload = lazy(importUpload)

function PageFallback() {
  return <LoadingState style={{ minHeight: '100vh' }} />
}

// Bloqueia a rota de uma tela quando o papel atual não pode vê-la: redireciona
// ao fallback. Cobre o acesso direto por URL (o menu já esconde o item).
function GatedRoute({ screen, children }: { screen: Screen; children: ReactNode }) {
  const { role } = useAuth()
  if (!podeVer(role, screen)) {
    return <Navigate to={ROTA_FALLBACK} replace />
  }
  return <>{children}</>
}

function ProtectedRoutes() {
  const { authenticated, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Ao perder a sessão (logout ou 401) fora da Visão Geral, zera a URL para "/"
  // (sem filtros). Assim, ao relogar, o app abre em Visão Geral limpa e não na
  // rota antiga — nem numa operadora específica — que o usuário via.
  useEffect(() => {
    const naVisaoGeral = location.pathname === '/' && location.search === ''
    if (!loading && !authenticated && !naVisaoGeral) {
      navigate('/', { replace: true })
    }
  }, [loading, authenticated, location.pathname, location.search, navigate])

  // Boot otimista: se já estamos autenticados (token válido) renderizamos o app
  // sem esperar o /me — o loading só bloqueia quando ainda não sabemos se há sessão.
  if (loading && !authenticated) {
    return <PageFallback />
  }
  if (!authenticated) {
    return <Login />
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/diretoria"
          element={
            <GatedRoute screen="diretoria">
              <Diretoria />
            </GatedRoute>
          }
        />
        <Route path="/gestor" element={<Gestor />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route
          path="/equipe"
          element={
            <GatedRoute screen="equipe">
              <Equipe />
            </GatedRoute>
          }
        />
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
