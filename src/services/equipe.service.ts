// Serviço de dados do domínio "equipe" (profissionais + escala + hospitais).
import { apiFetch } from '../api/client'
import type {
  AcessoProfissional, EquipePayload, ProfissionalDetalhe, ProfissionalCriado, ProfTipo, Hospital,
} from '../types/api'
import type { EntradaEscala } from './escala.service'

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

/** E-mail e senha da conta de login do profissional na plataforma. */
export interface CredenciaisAcesso {
  email: string
  password: string
}

/** Cria um novo profissional, já com os hospitais da escala dele (opcional) e
 *  a conta de acesso à plataforma (opcional, só o admin pode mandar).
 *  Uma chamada só: o backend grava o profissional e cada hospital com o id
 *  recém-criado, e devolve quantos entraram e quais não entraram; a conta que
 *  não pôde ser criada vem em `acesso_erro`, com o cadastro já gravado. */
export function criarProfissional(
  nome: string, tipo: ProfTipo, escala: EntradaEscala[] = [], acesso?: CredenciaisAcesso,
): Promise<ProfissionalCriado> {
  const body = acesso
    ? { nome, tipo, escala, acesso: { email: acesso.email.trim(), password: acesso.password } }
    : { nome, tipo, escala }
  return apiFetch<ProfissionalCriado>('/profissionais', { method: 'POST', body })
}

/** Dá acesso à plataforma a um profissional já cadastrado (só admin).
 *  O papel (médico/enfermeiro) sai do tipo do cadastro. */
export function criarAcessoProfissional(id: number, acesso: CredenciaisAcesso): Promise<AcessoProfissional> {
  return apiFetch<AcessoProfissional>(`/profissionais/${id}/acesso`, {
    method: 'POST', body: { email: acesso.email.trim(), password: acesso.password },
  })
}

/** Atualiza nome/tipo de um profissional. */
export function atualizarProfissional(id: number, nome: string, tipo: ProfTipo): Promise<unknown> {
  return apiFetch(`/profissionais/${id}`, { method: 'PATCH', body: { nome, tipo } })
}

/** Ativa/desativa um profissional. */
/** Exclui o auditor: conta de login (se houver), escala e cadastro. O backend
 *  recusa (e mantém o cadastro) se a conta não puder ser apagada. */
export function excluirProfissional(id: number): Promise<unknown> {
  return apiFetch(`/profissionais/${id}`, { method: 'DELETE' })
}

export function definirAtivoProfissional(id: number, ativo: boolean): Promise<unknown> {
  return apiFetch(`/profissionais/${id}`, { method: 'PATCH', body: { ativo: ativo ? 1 : 0 } })
}
