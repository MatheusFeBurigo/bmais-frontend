// Serviço de dados do domínio "equipe" (profissionais + escala + hospitais).
import { apiFetch } from '../api/client'
import type { EquipePayload, ProfissionalDetalhe, ProfTipo, Hospital } from '../types/api'

/** Lista de profissionais + resumo da equipe. */
export function fetchEquipe(): Promise<EquipePayload> {
  return apiFetch<EquipePayload>('/equipe')
}

/** Detalhe de um profissional (escala + histórico). */
export function fetchProfissional(id: number): Promise<ProfissionalDetalhe> {
  return apiFetch<ProfissionalDetalhe>(`/equipe/profissional/${id}`)
}

/** Hospitais de uma operadora (para montar a escala). */
export function fetchHospitais(operadora: string): Promise<Hospital[]> {
  return apiFetch<Hospital[]>(`/hospitais?op=${operadora}`)
}

/** TODOS os hospitais (sem filtro de operadora) — usado no multi-select de acesso. */
export function fetchTodosHospitais(): Promise<Hospital[]> {
  return apiFetch<Hospital[]>('/hospitais')
}

/** Cria um novo profissional. */
export function criarProfissional(nome: string, tipo: ProfTipo): Promise<unknown> {
  return apiFetch('/profissionais', { method: 'POST', body: { nome, tipo } })
}

/** Atualiza nome/tipo de um profissional. */
export function atualizarProfissional(id: number, nome: string, tipo: ProfTipo): Promise<unknown> {
  return apiFetch(`/profissionais/${id}`, { method: 'PATCH', body: { nome, tipo } })
}

/** Ativa/desativa um profissional. */
export function definirAtivoProfissional(id: number, ativo: boolean): Promise<unknown> {
  return apiFetch(`/profissionais/${id}`, { method: 'PATCH', body: { ativo: ativo ? 1 : 0 } })
}
