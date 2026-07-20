import { lazy } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { podeVer, ROTA_FALLBACK } from './auth/permissions'
import type { Screen } from './auth/permissions'
import Login from './pages/Login'
import { LoadingState } from './components/ui'
import AppLayout from './components/AppLayout'
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

// Guarda a área autenticada como layout de rota: sem sessão, navega para /login;
// com sessão, renderiza o AppLayout persistente (Sidebar + topbar) e as rotas
// filhas caem no <Outlet/> dele. Preserva a origem em location.state.
function RequireAuth() {
  const { authenticated, loading } = useAuth()
  const location = useLocation()

  // Boot otimista: com token tido como válido, renderiza o app sem esperar /me.
  // O loading só bloqueia enquanto ainda não sabemos se há sessão.
  if (loading && !authenticated) {
    return <PageFallback />
  }
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <AppLayout />
}

// Rota /login: se já autenticado, sai do login e volta para a origem (ou "/").
function LoginRoute() {
  const { authenticated } = useAuth()
  const location = useLocation()
  if (authenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }
  return <Login />
}

function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      {/* Área autenticada: o AppLayout (Sidebar + topbar) monta uma vez em
          RequireAuth e persiste; as telas trocam apenas no <Outlet/>. */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/diretoria"
          element={<GatedRoute screen="diretoria"><Diretoria /></GatedRoute>}
        />
        <Route path="/gestor" element={<Gestor />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route
          path="/equipe"
          element={<GatedRoute screen="equipe"><Equipe /></GatedRoute>}
        />
        <Route path="/upload" element={<Upload />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedRoutes />
    </BrowserRouter>
  )
}
