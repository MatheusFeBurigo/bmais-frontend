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
