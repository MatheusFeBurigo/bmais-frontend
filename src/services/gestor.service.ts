// Serviço de dados do domínio "gestor" (fluxo diário de internações).
import { apiFetch } from '../api/client'
import type { GestorResposta } from '../types/api'

export interface GestorParams {
  data?: string
  operadora?: string
  hospital?: string
  regiao?: string
}

/** Métricas de fluxo + opções de filtro num único payload ({ metrics, filtros }). */
export function fetchGestor(params: GestorParams): Promise<GestorResposta> {
  const qs = new URLSearchParams()
  if (params.data) qs.set('data', params.data)
  if (params.operadora) qs.set('operadora', params.operadora)
  if (params.hospital) qs.set('hospital', params.hospital)
  if (params.regiao) qs.set('regiao', params.regiao)
  return apiFetch<GestorResposta>(`/gestor?${qs.toString()}`)
}
