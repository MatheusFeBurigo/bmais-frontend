// Serviço de dados do domínio "auditoria" (trilha de ações — tela de Movimentações).
// Isola o contrato HTTP: a UI só fala com os hooks (hooks/useAuditoria).
import { apiFetch } from '../api/client'
import type { AuditoriaOpcoes, AuditoriaPayload, AuditoriaResumo } from '../types/api'

export interface AuditoriaParams {
  /** Filtra pelo usuário que agiu (user_id do profile). */
  userId?: string
  /** Família da ação (relatorio, censo, usuario…). */
  entidade?: string
  /** Ação específica (ex.: relatorio.registrar). */
  acao?: string
  /** Início/fim do período — ISO com fuso (meia-noite local convertida). */
  de?: string
  ate?: string
  /** Busca livre: resumo, e-mail/nome do usuário, id do alvo. */
  q?: string
  pagina?: number
  limite?: number
}

/** Uma página da trilha (mais recentes primeiro) + total para paginar. */
export function fetchAuditoria(p: AuditoriaParams): Promise<AuditoriaPayload> {
  const qs = new URLSearchParams()
  if (p.userId) qs.set('user_id', p.userId)
  if (p.entidade) qs.set('entidade', p.entidade)
  if (p.acao) qs.set('acao', p.acao)
  if (p.de) qs.set('de', p.de)
  if (p.ate) qs.set('ate', p.ate)
  if (p.q) qs.set('q', p.q)
  qs.set('pagina', String(p.pagina ?? 0))
  qs.set('limite', String(p.limite ?? 50))
  return apiFetch<AuditoriaPayload>(`/auditoria?${qs.toString()}`)
}

/** Entidades e ações do catálogo (opções de filtro com rótulo). */
export function fetchAuditoriaOpcoes(): Promise<AuditoriaOpcoes> {
  return apiFetch<AuditoriaOpcoes>('/auditoria/opcoes')
}

/** Totais do período + atividade por usuário (KPIs e painel "Usuários").
 *  `de` = início do período (ISO com fuso); vazio = últimos 30 dias. */
export function fetchAuditoriaResumo(de?: string): Promise<AuditoriaResumo> {
  const qs = new URLSearchParams()
  if (de) qs.set('de', de)
  const suffix = qs.toString()
  return apiFetch<AuditoriaResumo>(`/auditoria/resumo${suffix ? `?${suffix}` : ''}`)
}
