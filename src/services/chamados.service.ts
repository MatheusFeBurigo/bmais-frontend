// Serviço de dados do domínio "chamados" (dúvidas ao suporte, abertas pela Ajuda).
//
// O servidor já devolve cada chamado do ponto de vista de quem pede: `meu`,
// `nao_lido` e `minha` (em cada mensagem) vêm resolvidos. A tela não conhece o
// id do usuário nem decide quem é suporte: lê `atende` da listagem.
import { apiFetch } from '../api/client'
import type { UserRole } from '../types/api'

/** `aberto` aguarda o suporte; `respondido` aguarda quem abriu. A conversa
 *  termina como `encerrado` (o suporte a deu por concluída) ou `cancelado`
 *  (quem abriu desistiu). */
export type StatusChamado = 'aberto' | 'respondido' | 'encerrado' | 'cancelado'

export interface Chamado {
  id: number
  assunto: string
  status: StatusChamado
  autor_nome: string | null
  autor_email: string | null
  autor_role: UserRole | null
  criado_em: string
  atualizado_em: string
  encerrado_em: string | null
  /** Começo da última mensagem da conversa. */
  previa: string | null
  /** Aberto por quem está lendo. */
  meu: boolean
  /** Há mensagem do outro lado que quem está lendo ainda não abriu. */
  nao_lido: boolean
  /** O que quem está lendo pode fazer com este chamado agora. Encerrar é só do
   *  suporte; cancelar é de quem abriu (e do suporte). */
  pode_encerrar: boolean
  pode_cancelar: boolean
  pode_reabrir: boolean
}

export interface MensagemChamado {
  id: number
  texto: string
  autor_nome: string | null
  autor_role: UserRole | null
  do_suporte: boolean
  /** Escrita por quem está lendo. */
  minha: boolean
  criado_em: string
}

export interface ListaChamados {
  /** Quem lê faz parte do suporte (vê os chamados de todos). */
  atende: boolean
  chamados: Chamado[]
}

export interface ConversaChamado {
  chamado: Chamado
  mensagens: MensagemChamado[]
}

export function fetchChamados(): Promise<ListaChamados> {
  return apiFetch<ListaChamados>('/chamados')
}

export function fetchChamadosNaoLidos(): Promise<{ nao_lidos: number }> {
  return apiFetch<{ nao_lidos: number }>('/chamados/nao-lidos')
}

/** A conversa inteira. Buscar já marca como lida no servidor. */
export function fetchConversa(id: number): Promise<ConversaChamado> {
  return apiFetch<ConversaChamado>(`/chamados/${id}`)
}

export function abrirChamado(assunto: string, mensagem: string): Promise<{ chamado: Chamado }> {
  return apiFetch('/chamados', { method: 'POST', body: { assunto, mensagem } })
}

export function responderChamado(
  id: number, texto: string,
): Promise<{ chamado: Chamado; mensagem: MensagemChamado }> {
  return apiFetch(`/chamados/${id}/mensagens`, { method: 'POST', body: { texto } })
}

export function encerrarChamado(id: number): Promise<{ chamado: Chamado }> {
  return apiFetch(`/chamados/${id}/encerrar`, { method: 'POST' })
}

export function cancelarChamado(id: number): Promise<{ chamado: Chamado }> {
  return apiFetch(`/chamados/${id}/cancelar`, { method: 'POST' })
}

export function reabrirChamado(id: number): Promise<{ chamado: Chamado }> {
  return apiFetch(`/chamados/${id}/reabrir`, { method: 'POST' })
}
