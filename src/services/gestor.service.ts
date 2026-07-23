// Serviço de dados do domínio "gestor" (fluxo diário de internações).
import { apiFetch } from '../api/client'
import type { GestorResposta } from '../types/api'

export interface GestorParams {
  data?: string
  operadora?: string
  hospital?: string
  regiao?: string
  /** Janela do gráfico de fluxo: '30d' | '90d' | '6m' | '1a'. */
  janela?: string
  /** Intervalo (ambos) — ancora o painel no período do bucket clicado no
   *  gráfico. Tem precedência sobre `data` no backend. */
  inicio?: string
  fim?: string
}

/** Métricas de fluxo + opções de filtro num único payload ({ metrics, filtros }). */
export function fetchGestor(params: GestorParams): Promise<GestorResposta> {
  const qs = new URLSearchParams()
  if (params.data) qs.set('data', params.data)
  if (params.operadora) qs.set('operadora', params.operadora)
  if (params.hospital) qs.set('hospital', params.hospital)
  if (params.regiao) qs.set('regiao', params.regiao)
  if (params.janela) qs.set('janela', params.janela)
  if (params.inicio) qs.set('inicio', params.inicio)
  if (params.fim) qs.set('fim', params.fim)
  return apiFetch<GestorResposta>(`/gestor?${qs.toString()}`)
}
