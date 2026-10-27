// Pendências avulsas da equipe (21/10/2026): o gestor ou o coordenador pede,
// quem recebeu conclui. Backend: routes/pendencias.py.
import { apiFetch } from '../api/client'
import type { NovaPendencia, Pendencia, PendenciasMinhas, PessoaEquipe } from '../types/api'

/** As que o usuário recebeu e as que ele pediu (topo de Tarefas). */
export function fetchMinhasPendencias(): Promise<PendenciasMinhas> {
  return apiFetch<PendenciasMinhas>('/pendencias')
}

/** As abertas de uma pessoa da equipe (Distribuição de tarefas). */
export function fetchPendenciasDaPessoa(userId: string): Promise<{ pendencias: Pendencia[] }> {
  return apiFetch(`/pendencias/pessoa/${encodeURIComponent(userId)}`)
}

/** Quem pode receber uma pendência de quem está logado. */
export function fetchEquipePendencias(): Promise<{ pessoas: PessoaEquipe[] }> {
  return apiFetch('/pendencias/equipe')
}

export function criarPendencia(p: NovaPendencia): Promise<{ ok: boolean; pendencia: Pendencia }> {
  return apiFetch('/pendencias', { method: 'POST', body: p })
}

export function concluirPendencia(id: number): Promise<unknown> {
  return apiFetch(`/pendencias/${id}/concluir`, { method: 'POST' })
}

export function excluirPendencia(id: number): Promise<unknown> {
  return apiFetch(`/pendencias/${id}`, { method: 'DELETE' })
}

/** Movimentos da situação (0059): pendente → aguardando, de volta, e reabrir a resolvida. */
export type MovimentoPendencia = 'aguardando' | 'pendente' | 'reabrir'

export function moverPendencia(id: number, para: MovimentoPendencia): Promise<unknown> {
  return apiFetch(`/pendencias/${id}/${para}`, { method: 'POST' })
}

/** As recebidas ainda não vistas: o aviso de pendência nova. */
export function fetchPendenciasNovas(): Promise<{ pendencias: Pendencia[] }> {
  return apiFetch('/pendencias/novas')
}

/** Quem abriu a aba Pendências viu o que recebeu. */
export function marcarPendenciasVistas(): Promise<{ ok: boolean; vistas: number }> {
  return apiFetch('/pendencias/vistas', { method: 'POST' })
}
