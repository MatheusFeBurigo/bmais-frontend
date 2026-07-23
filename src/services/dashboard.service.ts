// Serviço de dados do domínio "dashboard" (Visão Geral + Sidebar).
//
// Encapsula o transporte HTTP: monta as URLs, chama o apiFetch e devolve tipos de
// domínio. A UI e os hooks consomem estas funções — não conhecem endpoints,
// querystrings nem o cliente HTTP. Trocar o transporte (ou mockar em teste) fica
// contido aqui, sem tocar em componente nenhum.

import { apiFetch, apiDownload } from '../api/client'
import type {
  DashboardPayload, DashboardOverview, SidebarData, PacienteNovo, CriarInternacaoResponse,
} from '../types/api'

export interface DashboardParams {
  operadora: string
  filtro: string
  hospital?: string
  q?: string
}

/** Payload da Visão Geral para uma operadora/filtro/hospital. */
export function fetchDashboard(params: DashboardParams): Promise<DashboardPayload> {
  const qs = new URLSearchParams()
  qs.set('operadora', params.operadora)
  qs.set('filtro', params.filtro)
  if (params.hospital) qs.set('hospital', params.hospital)
  if (params.q) qs.set('q', params.q)
  return apiFetch<DashboardPayload>(`/dashboard?${qs.toString()}`)
}

/** Panorama de TODAS as operadoras (stats + hospitais) num único disparo. */
export function fetchDashboardOverview(): Promise<DashboardOverview> {
  return apiFetch<DashboardOverview>('/dashboard/overview')
}

// Cache PERSISTENTE do sidebar. O cache do React Query é em memória e morre no
// reload — por isso, após um refresh, a Sidebar refazia o fetch e mostrava as
// operadoras/badge vazios até voltar. Espelhamos o último snapshot no
// localStorage para hidratar a Sidebar na 1ª pintura (revalida em background).
const SIDEBAR_CACHE_KEY = 'bmais_sidebar_cache'

/** Último SidebarData salvo (para `initialData` do useSidebar). null se ausente/corrompido. */
export function getSidebarCache(): SidebarData | null {
  try {
    const raw = localStorage.getItem(SIDEBAR_CACHE_KEY)
    return raw ? (JSON.parse(raw) as SidebarData) : null
  } catch {
    return null
  }
}

/** Limpa o snapshot (chamado no logout — não vazar o recorte de um usuário ao próximo). */
export function clearSidebarCache() {
  localStorage.removeItem(SIDEBAR_CACHE_KEY)
}

/** Contadores por operadora + data de referência (sidebar, reusado no Dashboard). */
export async function fetchSidebar(): Promise<SidebarData> {
  const data = await apiFetch<SidebarData>('/sidebar')
  // Espelha o snapshot fresco para o próximo boot hidratar a Sidebar na hora.
  try {
    localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(data))
  } catch {
    // storage cheio/indisponível: segue sem persistir (não quebra o fetch).
  }
  return data
}

/** Adiciona um paciente/internação manualmente (ação "Adicionar paciente" da Visão Geral).
 *  Dedupe por (hospital_key, atendimento) no backend: `ja_existia` avisa se casou num já existente. */
export function criarPacienteManual(paciente: PacienteNovo): Promise<CriarInternacaoResponse> {
  return apiFetch<CriarInternacaoResponse>('/internacoes', { method: 'POST', body: paciente })
}

/** Sentinel de operadora: exporta TODAS as operadoras num único arquivo. */
export const EXPORTAR_TODAS = '__todas__'

/** Exporta a planilha de controle de auditoria (download).
 *  `operadora` = EXPORTAR_TODAS gera um único xlsx com todas as operadoras. */
export function exportarRvm(operadora: string): Promise<void> {
  const nome = operadora === EXPORTAR_TODAS ? 'TODAS' : operadora
  return apiDownload(
    `/export-rvm?operadora=${encodeURIComponent(operadora)}`,
    `CONTROLE_AUDITORIA_${nome}.xlsx`,
  )
}
