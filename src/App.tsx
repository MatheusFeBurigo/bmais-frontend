import { lazy } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { podeVer, rotaFallback } from './auth/permissions'
import type { Screen } from './auth/permissions'
import Login from './pages/Login'
import { LoadingState } from './components/ui'
import AppLayout from './components/AppLayout'
import {
  importDashboard, importDiretoria, importGestor,
  importEquipe, importConfiguracoes, importUpload,
  importKanban, importPaciente, importUsuarioForm,
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
const Kanban = lazy(importKanban)
const Paciente = lazy(importPaciente)
const UsuarioForm = lazy(importUsuarioForm)

function PageFallback() {
  return <LoadingState style={{ minHeight: '100vh' }} />
}

// Bloqueia a rota de uma tela quando o papel atual não pode vê-la: redireciona
// ao fallback. Cobre o acesso direto por URL (o menu já esconde o item).
function GatedRoute({ screen, children }: { screen: Screen; children: ReactNode }) {
  const { role, perfilCarregando } = useAuth()
  // Boot/login: o papel chega DEPOIS do /me. Decidir com role=null liberaria a
  // rota e a redirecionaria ao resolver o papel (flash de tela). Aguarda o perfil
  // (perfilCarregando nunca trava: vira false mesmo se o /me falhar).
  if (perfilCarregando) return <PageFallback />
  if (!podeVer(role, screen)) {
    // Destino por papel: gestor barrado em "/" cai em "/gestor", não num loop.
    return <Navigate to={rotaFallback(role)} replace />
  }
  return <>{children}</>
}

// Restringe uma rota a administradores (gestão de usuários). Redireciona quem
// não for admin — defesa por rota, além do gating de UI.
function RequireAdmin({ children }: { children: ReactNode }) {
  const { role, perfilCarregando } = useAuth()
  if (perfilCarregando) return <PageFallback />
  if (role !== 'admin') return <Navigate to={rotaFallback(role)} replace />
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
        <Route path="/" element={<GatedRoute screen="operacional"><Dashboard /></GatedRoute>} />
        <Route
          path="/diretoria"
          element={<GatedRoute screen="diretoria"><Diretoria /></GatedRoute>}
        />
        <Route path="/gestor" element={<GatedRoute screen="gestor"><Gestor /></GatedRoute>} />
        <Route
          path="/configuracoes"
          element={<GatedRoute screen="configuracoes"><Configuracoes /></GatedRoute>}
        />
        <Route
          path="/equipe"
          element={<GatedRoute screen="equipe"><Equipe /></GatedRoute>}
        />
        <Route path="/upload" element={<Upload />} />
        <Route path="/kanban" element={<GatedRoute screen="kanban"><Kanban /></GatedRoute>} />
        <Route path="/paciente/:id" element={<Paciente />} />
        {/* Gestão de usuários (admin-only): /novo antes de /:id p/ o literal vencer. */}
        <Route path="/usuarios/novo" element={<RequireAdmin><UsuarioForm /></RequireAdmin>} />
        <Route path="/usuarios/:id" element={<RequireAdmin><UsuarioForm /></RequireAdmin>} />
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
