// Serviço de dados do domínio "configuracoes" (operadoras + hospitais + regras).
import { apiFetch } from '../api/client'
import type { ConfiguracoesPayload, Hospital, HospitalFicha, OperadoraRegras, TimelineHospital } from '../types/api'

export interface ConfiguracoesParams {
  op?: string
  hospital?: string
}

interface OkResult { ok?: boolean; salvo?: boolean; criado?: boolean }

/** Payload da tela: overview + (opcional) operadora + hospital selecionados. */
export function fetchConfiguracoes(params: ConfiguracoesParams): Promise<ConfiguracoesPayload> {
  const { op, hospital } = params
  // `hospital` sozinho e valido: a ficha do hospital abre sem operadora na URL
  // (um hospital atende varias operadoras, entao nenhuma delas o identifica).
  const q = new URLSearchParams()
  if (op) q.set('op', op)
  if (hospital) q.set('hospital', hospital)
  const qs = q.toString()
  return apiFetch<ConfiguracoesPayload>(`/configuracoes${qs ? `?${qs}` : ''}`)
}

/** Salva as regras de uma operadora existente. */
export function salvarRegrasOperadora(
  key: string, nome: string, regras: OperadoraRegras,
): Promise<OkResult> {
  return apiFetch<OkResult>(`/configuracoes/operadora/${key}`, {
    method: 'POST',
    body: { key, nome, ...regras },
  })
}

/** Cria uma nova operadora. */
export function criarOperadora(nome: string, key: string): Promise<OkResult> {
  return apiFetch<OkResult>('/configuracoes/operadora', {
    method: 'POST',
    body: { nome: nome.trim(), key: key.trim() },
  })
}

/** Cria um novo hospital vinculado a uma operadora. */
export function criarHospital(nome: string, operadoraKey: string, key: string): Promise<OkResult> {
  return apiFetch<OkResult>('/configuracoes/hospital', {
    method: 'POST',
    body: { nome, operadora_key: operadoraKey, key },
  })
}

/** Ficha cadastral de um hospital, com as operadoras vinculadas. */
export function fetchHospital(key: string): Promise<Hospital> {
  return apiFetch<Hospital>(`/hospital/${key}`)
}

/** Em que dias o hospital mandou censo, e quem veio em cada um. */
export function fetchTimelineHospital(key: string): Promise<TimelineHospital> {
  return apiFetch<TimelineHospital>(`/hospital/${key}/timeline`)
}

/** Atualiza os dados cadastrais/contatos do hospital. */
export function salvarFichaHospital(key: string, ficha: HospitalFicha & { nome?: string; regiao?: string | null }): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${key}`, { method: 'PATCH', body: ficha })
}

/** Vincula mais uma operadora ao hospital (N-N). */
export function vincularOperadora(hospitalKey: string, operadoraKey: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${hospitalKey}/operadoras`, {
    method: 'POST',
    body: { operadora_key: operadoraKey },
  })
}

/** Apaga o cadastro do hospital. O backend recusa (409) quando ha pacientes ou
 *  escala apontando para ele — a mensagem do erro diz o que esta prendendo. */
export function excluirHospital(key: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${key}`, { method: 'DELETE' })
}

/** Troca o nome de exibicao da operadora (a key e identidade, nao muda). */
export function renomearOperadora(key: string, nome: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/configuracoes/operadora/${key}/nome`, {
    method: 'PATCH',
    body: { nome: nome.trim() },
  })
}

/** Apaga a operadora. Recusada (409) enquanto tiver hospital ou paciente. */
export function excluirOperadora(key: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/configuracoes/operadora/${key}`, { method: 'DELETE' })
}

/** Remove o vinculo do hospital com uma operadora. */
export function desvincularOperadora(hospitalKey: string, operadoraKey: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${hospitalKey}/operadoras/${operadoraKey}`, {
    method: 'DELETE',
  })
}
