// Autorização para relatório de paciente fora da área (09/11/2026, 0061): o
// técnico pede na ficha, o coordenador técnico, o gestor ou o admin decide na
// tela Aprovações. Backend: routes/autorizacoes.py.
import { apiFetch } from '../api/client'

export type SituacaoAutorizacao = 'pendente' | 'aprovada' | 'usada' | 'recusada' | 'cancelada'

/** Quem é o paciente do pedido (só na lista da tela Aprovações). */
export interface PacienteDoPedido {
  nome: string | null
  hospital_nome: string | null
  operadora_key: string | null
  operadora_nome: string | null
  leito: string | null
  status: string | null
}

export interface AutorizacaoRelatorio {
  id: number
  internacao_id: number
  situacao: SituacaoAutorizacao
  motivo: string | null
  /** O que quem decidiu escreveu ao aprovar ou recusar (opcional). */
  resposta: string | null
  criado_em: string | null
  decidido_em: string | null
  usada_em: string | null
  relatorio_id: number | null
  solicitante_nome: string | null
  solicitante_role: string | null
  decidido_por_nome?: string | null
  /** O pedido é de quem está olhando. */
  meu: boolean
  pode_cancelar: boolean
  /** Pendente, de outra pessoa, e quem olha decide. */
  pode_decidir: boolean
  paciente?: PacienteDoPedido | null
}

/** O que a ficha do paciente mostra a quem abriu. */
export interface AutorizacaoNaFicha {
  fora_da_area: boolean
  /** Fora da área, papel que pede, e sem pedido em aberto. */
  pode_pedir: boolean
  /** Há autorização aprovada e ainda não usada: libera UM relatório. */
  liberado: boolean
  /** O último pedido de quem abriu para esta internação. */
  autorizacao: AutorizacaoRelatorio | null
}

export function fetchAutorizacaoNaFicha(internacaoId: number): Promise<AutorizacaoNaFicha> {
  return apiFetch(`/internacao/${internacaoId}/autorizacao-relatorio`)
}

export function pedirAutorizacao(internacaoId: number, motivo: string):
  Promise<{ ok: boolean; autorizacao: AutorizacaoRelatorio }> {
  return apiFetch(`/internacao/${internacaoId}/autorizacao-relatorio`,
    { method: 'POST', body: { motivo } })
}

export function cancelarAutorizacao(id: number): Promise<unknown> {
  return apiFetch(`/autorizacoes-relatorio/${id}/cancelar`, { method: 'POST' })
}

export type QuaisAutorizacoes = 'pendentes' | 'decididas'

export function fetchAutorizacoes(quais: QuaisAutorizacoes):
  Promise<{ autorizacoes: AutorizacaoRelatorio[] }> {
  return apiFetch(`/autorizacoes-relatorio?quais=${quais}`)
}

/** As pendentes que quem está logado pode decidir: o contador do menu. */
export function fetchContagemAutorizacoes(): Promise<{ pendentes: number }> {
  return apiFetch('/autorizacoes-relatorio/contagem')
}

export function decidirAutorizacao(id: number, aprovar: boolean, resposta: string): Promise<unknown> {
  return apiFetch(`/autorizacoes-relatorio/${id}/${aprovar ? 'aprovar' : 'recusar'}`,
    { method: 'POST', body: { resposta } })
}
