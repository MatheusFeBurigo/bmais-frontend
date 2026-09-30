import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import {
  ehProfissional, podeGerirOperacoes, podeVer, podeVerFichaPaciente, rotaChamados, rotaFallback,
  ROTA_CHAMADOS_AJUDA, ROTA_CHAMADOS_ATENDIMENTO,
} from './auth/permissions'
import type { Screen } from './auth/permissions'
import Login from './pages/Login'
import { LoadingState } from './components/ui'
import DashboardSkeleton from './components/internados/DashboardSkeleton'
import AppLayout from './components/AppLayout'
import {
  importDashboard, importDiretoria, importGestor,
  importEquipe, importConfiguracoes, importUpload,
  importKanban, importPaciente, importUsuarioForm, importLogs, importAjuda,
  importProgresso, importVolumetria, importRelatorio, importPortalProfissional,
  importChamados,
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
const Logs = lazy(importLogs)
const Ajuda = lazy(importAjuda)
const Chamados = lazy(importChamados)
const Progresso = lazy(importProgresso)
const Volumetria = lazy(importVolumetria)
const Relatorio = lazy(importRelatorio)
const PortalProfissional = lazy(importPortalProfissional)

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

// Ficha completa do paciente: fechada ao analista interno (cobre a URL direta).
function RequireFichaPaciente({ children }: { children: ReactNode }) {
  const { role, perfilCarregando } = useAuth()
  if (perfilCarregando) return <PageFallback />
  if (!podeVerFichaPaciente(role)) return <Navigate to={rotaFallback(role)} replace />
  return <>{children}</>
}

// Gestão de usuários (tela Operações): administrador e analista interno.
function RequireGestaoOperacoes({ children }: { children: ReactNode }) {
  const { role, perfilCarregando } = useAuth()
  if (perfilCarregando) return <PageFallback />
  if (!podeGerirOperacoes(role)) return <Navigate to={rotaFallback(role)} replace />
  return <>{children}</>
}

// Chamados: a mesma tela em dois endereços, um por lado da conversa. Quem atende
// (administrador) usa /chamados, aberto pelo menu Sistema; os demais usam
// /ajuda/chamados, aberto pela Ajuda. Quem chega pelo endereço do outro lado
// (link colado, favorito antigo) é levado ao seu, com a mesma conversa aberta.
function RotaChamados() {
  const { role, perfilCarregando } = useAuth()
  const location = useLocation()
  if (perfilCarregando) return <PageFallback />
  const certa = rotaChamados(role)
  if (location.pathname !== certa) return <Navigate to={certa + location.search} replace />
  return <Chamados />
}

// Guarda a área autenticada como layout de rota: sem sessão, navega para /login;
// com sessão, renderiza o AppLayout persistente (Sidebar + topbar) e as rotas
// filhas caem no <Outlet/> dele. Preserva a origem em location.state.
function RequireAuth() {
  const { authenticated, loading, role, perfilCarregando } = useAuth()
  const location = useLocation()

  // Boot otimista: com token tido como válido, renderiza o app sem esperar /me.
  // O loading só bloqueia enquanto ainda não sabemos se há sessão.
  if (loading && !authenticated) {
    return <PageFallback />
  }
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  // Papel ainda desconhecido (1º login, nada salvo): esperar o /me em vez de
  // montar o AppLayout, que num médico/enfermeiro pintaria a Sidebar e dispararia
  // consultas que o backend recusa, para logo depois trocar pelo portal.
  if (perfilCarregando && !role) {
    return <PageFallback />
  }
  // Médico/enfermeiro: portal próprio em QUALQUER rota, sem Sidebar nem telas
  // internas. A URL fica como veio; não há rota interna para onde mandá-lo.
  if (ehProfissional(role)) {
    return (
      <Suspense fallback={<PageFallback />}>
        <PortalProfissional papel={role} />
      </Suspense>
    )
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
        {/* Suspense próprio do Dashboard: durante o download do chunk, mostra o
            MESMO esqueleto que a tela usa enquanto os dados chegam — carregamento
            contínuo, sem o spinner genérico do boundary do AppLayout antes. */}
        <Route
          path="/"
          element={
            <GatedRoute screen="operacional">
              <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
              </Suspense>
            </GatedRoute>
          }
        />
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
        <Route path="/upload" element={<GatedRoute screen="upload"><Upload /></GatedRoute>} />
        <Route path="/tarefas" element={<GatedRoute screen="kanban"><Kanban /></GatedRoute>} />
        {/* Endereço antigo da tela (era "Kanban"): mantém favoritos funcionando. */}
        <Route path="/kanban" element={<Navigate to="/tarefas" replace />} />
        {/* Movimentações (auditoria): analista interno e admin (EXCLUSIVAS.logs). */}
        <Route path="/logs" element={<GatedRoute screen="logs"><Logs /></GatedRoute>} />
        {/* Progresso (avanço do projeto): administração e diretoria. */}
        <Route
          path="/progresso"
          element={<GatedRoute screen="progresso"><Progresso /></GatedRoute>}
        />
        {/* Relatório da auditoria: subrota de Progresso, sob o MESMO gate — é
            leitura de apoio ao quadro de módulos, aberta pelo botão de lá. */}
        <Route
          path="/progresso/relatorio"
          element={<GatedRoute screen="progresso"><Relatorio /></GatedRoute>}
        />
        {/* Distribuição de tarefas (carga por pessoa): coordenadores + admin.
            O id técnico continua "volumetria" (screen, API, arquivos). */}
        <Route
          path="/distribuicao"
          element={<GatedRoute screen="volumetria"><Volumetria /></GatedRoute>}
        />
        {/* Endereço antigo da tela (era "Volumetria"): mantém favoritos funcionando. */}
        <Route path="/volumetria" element={<Navigate to="/distribuicao" replace />} />
        <Route path="/paciente/:id" element={<RequireFichaPaciente><Paciente /></RequireFichaPaciente>} />
        {/* Ajuda (documentação das telas): sem GatedRoute — todo papel acessa.
            O recorte é POR MÓDULO dentro da tela, pela mesma hierarquia das
            demais (components/ajuda/catalogo.tsx). */}
        <Route path="/ajuda" element={<Ajuda />} />
        {/* Chamados (dúvidas ao suporte): todo papel acessa, cada um pelo seu
            endereço (ver RotaChamados). Cada pessoa vê os próprios chamados e
            o administrador vê os de todos; esse recorte é do servidor. */}
        <Route path={ROTA_CHAMADOS_AJUDA} element={<RotaChamados />} />
        <Route path={ROTA_CHAMADOS_ATENDIMENTO} element={<RotaChamados />} />
        {/* Gestão de usuários (admin e analista): /novo antes de /:id p/ o literal vencer. */}
        <Route path="/usuarios/novo" element={<RequireGestaoOperacoes><UsuarioForm /></RequireGestaoOperacoes>} />
        <Route path="/usuarios/:id" element={<RequireGestaoOperacoes><UsuarioForm /></RequireGestaoOperacoes>} />
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
