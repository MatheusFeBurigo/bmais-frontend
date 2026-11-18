// Imports dinâmicos das páginas, centralizados para que o roteador (lazy) e a
// Sidebar (prefetch no hover) usem o MESMO import() — o Vite deduplica, então
// aquecer no hover carrega o chunk que o clique vai reaproveitar na hora.

export const importDashboard = () => import('./pages/Dashboard')
export const importDiretoria = () => import('./pages/Diretoria')
export const importGestor = () => import('./pages/Gestor')
export const importEquipe = () => import('./pages/Equipe')
export const importConfiguracoes = () => import('./pages/Configuracoes')
export const importUpload = () => import('./pages/Upload')
export const importKanban = () => import('./pages/Kanban')
export const importPaciente = () => import('./pages/Paciente')
export const importFormularioPorto = () => import('./pages/FormularioPorto')
export const importImprimirRelatorio = () => import('./pages/ImprimirRelatorio')
export const importUsuarioForm = () => import('./pages/UsuarioForm')
export const importLogs = () => import('./pages/Logs')
export const importAjuda = () => import('./pages/Ajuda')
export const importChamados = () => import('./pages/Chamados')
export const importProgresso = () => import('./pages/Progresso')
export const importVolumetria = () => import('./pages/Volumetria')
export const importRelatorio = () => import('./pages/Relatorio')
export const importDocumentacao = () => import('./pages/DocumentacaoTecnica')
export const importPortalProfissional = () => import('./pages/PortalProfissional')
export const importAprovacoes = () => import('./pages/Aprovacoes')
export const importAuditores = () => import('./pages/Auditores')
export const importFechamentos = () => import('./pages/Fechamentos')
export const importAusencias = () => import('./pages/Ausencias')
export const importAgendaServicos = () => import('./pages/AgendaServicos')

// Mapa rota → prefetch, consumido pela Sidebar via onMouseEnter/onFocus.
export const prefetchPorRota: Record<string, () => Promise<unknown>> = {
  '/': importDashboard,
  '/diretoria': importDiretoria,
  '/gestor': importGestor,
  '/equipe': importEquipe,
  '/configuracoes': importConfiguracoes,
  '/upload': importUpload,
  '/tarefas': importKanban,
  '/logs': importLogs,
  '/ajuda': importAjuda,
  '/ajuda/chamados': importChamados,
  '/chamados': importChamados,
  '/progresso': importProgresso,
  '/distribuicao': importVolumetria,
  '/aprovacoes': importAprovacoes,
  '/auditores': importAuditores,
  '/modulo-2/fechamentos': importFechamentos,
  '/modulo-2/ausencias': importAusencias,
  '/modulo-2/agenda-de-servicos': importAgendaServicos,
  '/progresso/relatorio': importRelatorio,
  '/progresso/documentacao': importDocumentacao,
}
