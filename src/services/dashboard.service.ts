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

/** Contadores por operadora + data de referência (sidebar, reusado no Dashboard). */
export function fetchSidebar(): Promise<SidebarData> {
  return apiFetch<SidebarData>('/sidebar')
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
