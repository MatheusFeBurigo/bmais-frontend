// Serviço de dados do domínio "internação" (detalhe do paciente no drawer).
import { apiFetch } from '../api/client'
import type { InternacaoDados, InternacaoTimeline } from '../types/api'

export interface RelatorioRapido {
  data_visita: string
  medico: string
  descricao: string
  autor?: string
}

/** Dados completos de uma internação (histórico, relatórios, eventos). */
export function fetchInternacaoDados(id: number): Promise<InternacaoDados> {
  return apiFetch<InternacaoDados>(`/internacao/${id}/dados`)
}

/** Timeline cronológica da internação (admissão, relatórios, alta, pendências). */
export function fetchInternacaoTimeline(id: number): Promise<InternacaoTimeline> {
  return apiFetch<InternacaoTimeline>(`/internacao/${id}/timeline`)
}

/** Registra um relatório rápido a partir do drawer do paciente. */
export function registrarRelatorioRapido(id: number, rel: RelatorioRapido): Promise<unknown> {
  return apiFetch(`/internacao/${id}/relatorio-rapido`, {
    method: 'POST',
    body: { autor: 'operador', ...rel },
  })
}
