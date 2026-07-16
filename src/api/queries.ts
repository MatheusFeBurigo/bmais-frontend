// Query options reutilizáveis. Centralizar a definição evita que a mesma queryKey
// (ex.: ['sidebar']) apareça com staleTime diferente em cada tela — o React Query
// usa o menor staleTime observado, então divergências causam refetch inesperado.

import { apiFetch } from './client'
import type { SidebarData } from '../types/api'

// Chaves de cache que representam DADOS DERIVADOS de censos/relatórios. Após um
// upload, todas ficam obsoletas — invalidar em bloco força o refetch na volta.
export const CHAVES_DADOS = ['dashboard', 'diretoria', 'gestor', 'sidebar', 'equipe'] as const

// Sidebar: contadores por operadora + data de referência. Consumida pela própria
// Sidebar e reaproveitada pelo Dashboard (seletor de operadora).
export function sidebarQuery() {
  return {
    queryKey: ['sidebar'] as const,
    queryFn: () => apiFetch<SidebarData>('/sidebar'),
    staleTime: 30_000,
  }
}
