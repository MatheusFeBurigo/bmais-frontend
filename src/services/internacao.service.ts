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

// Campos que o backend aceita editar (espelha CAMPOS_EDITAVEIS no repositório).
// Mantê-los tipados evita enviar chaves que o backend descartaria silenciosamente.
export interface InternacaoEdicao {
  nome?: string
  atendimento?: string
  data_entrada?: string
  hora_entrada?: string
  data_alta?: string
  hora_alta?: string
  tipo_leito?: string
  leito_codigo?: string
  especialidade?: string
  convenio?: string
  categoria?: string
  diagnostico?: string
  medico?: string
  idade?: string
  sexo?: string
  rn?: string
  status?: string
  obs?: string
}

/** Edita os dados de uma internação. Autoria é derivada do usuário logado no backend. */
export function editarInternacao(id: number, mudancas: InternacaoEdicao): Promise<{
  atualizado?: boolean
  campos_alterados?: string[]
  mensagem?: string
}> {
  return apiFetch(`/internacao/${id}/editar`, { method: 'POST', body: mudancas })
}

/** Registra um relatório rápido a partir do drawer do paciente. */
export function registrarRelatorioRapido(id: number, rel: RelatorioRapido): Promise<unknown> {
  return apiFetch(`/internacao/${id}/relatorio-rapido`, {
    method: 'POST',
    body: { autor: 'operador', ...rel },
  })
}
