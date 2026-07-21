// Imports dinâmicos das páginas, centralizados para que o roteador (lazy) e a
// Sidebar (prefetch no hover) usem o MESMO import() — o Vite deduplica, então
// aquecer no hover carrega o chunk que o clique vai reaproveitar na hora.

export const importDashboard = () => import('./pages/Dashboard')
export const importDiretoria = () => import('./pages/Diretoria')
export const importGestor = () => import('./pages/Gestor')
export const importEquipe = () => import('./pages/Equipe')
export const importConfiguracoes = () => import('./pages/Configuracoes')
export const importUpload = () => import('./pages/Upload')
export const importPaciente = () => import('./pages/Paciente')
export const importUsuarioForm = () => import('./pages/UsuarioForm')

// Mapa rota → prefetch, consumido pela Sidebar via onMouseEnter/onFocus.
export const prefetchPorRota: Record<string, () => Promise<unknown>> = {
  '/': importDashboard,
  '/diretoria': importDiretoria,
  '/gestor': importGestor,
  '/equipe': importEquipe,
  '/configuracoes': importConfiguracoes,
  '/upload': importUpload,
}
