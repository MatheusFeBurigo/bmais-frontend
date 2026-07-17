// Serviço de dados do domínio "dashboard" (Visão Geral + Sidebar).
//
// Encapsula o transporte HTTP: monta as URLs, chama o apiFetch e devolve tipos de
// domínio. A UI e os hooks consomem estas funções — não conhecem endpoints,
// querystrings nem o cliente HTTP. Trocar o transporte (ou mockar em teste) fica
// contido aqui, sem tocar em componente nenhum.

import { apiFetch, apiDownload } from '../api/client'
import type { DashboardPayload, SidebarData } from '../types/api'

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

/** Contadores por operadora + data de referência (sidebar, reusado no Dashboard). */
export function fetchSidebar(): Promise<SidebarData> {
  return apiFetch<SidebarData>('/sidebar')
}

/** Exporta a planilha de controle de auditoria de uma operadora (download). */
export function exportarRvm(operadora: string): Promise<void> {
  return apiDownload(
    `/export-rvm?operadora=${encodeURIComponent(operadora)}`,
    `CONTROLE_AUDITORIA_${operadora}.xlsx`,
  )
}
