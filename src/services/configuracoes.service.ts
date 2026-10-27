// Serviço de dados do domínio "configuracoes" (operadoras + hospitais + regras).
import { apiFetch } from '../api/client'
import type {
  ConfiguracoesPayload, Hospital, HospitalFicha, OperadoraRegras, RegrasCobranca,
  RegrasHospitalOperadora, TimelineHospital,
} from '../types/api'

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

export interface NovoHospital extends HospitalFicha {
  key: string
  nome: string
  /** Todas as operadoras atendidas; a primeira vira a principal. */
  operadoras: string[]
  regiao: string
}

/** Cria o hospital já com a ficha e o vínculo com cada operadora (um pedido só). */
export function criarHospital(dados: NovoHospital): Promise<OkResult> {
  return apiFetch<OkResult>('/configuracoes/hospital', { method: 'POST', body: dados })
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

/** O que a exclusao do hospital vai mexer, para o alerta antes de confirmar:
 *  os pacientes (que passam para o Sem hospital) e a escala (que sai junto). */
export function dependentesHospital(key: string): Promise<{ pacientes: number; escala: number }> {
  return apiFetch<{ pacientes: number; escala: number }>(`/hospital/${key}/dependentes`)
}

/** Apaga o cadastro do hospital. Com pacientes, so com `moverPacientes` (a
 *  confirmacao do alerta, 27/10/2026): eles passam para o Sem hospital; sem
 *  ela, o backend recusa (409) dizendo quantos. A escala do hospital sai junto.
 *  O resultado conta o que foi junto, para o aviso de sucesso. */
export function excluirHospital(key: string, moverPacientes = false): Promise<
  OkResult & { pacientes_movidos?: number; escala_removida?: number }
> {
  return apiFetch<OkResult & { pacientes_movidos?: number; escala_removida?: number }>(
    `/hospital/${key}${moverPacientes ? '?mover_pacientes=true' : ''}`, { method: 'DELETE' })
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

/** Regras de cobranca do hospital em cada operadora que ele atende. */
export function fetchRegrasHospital(key: string): Promise<{ operadoras: RegrasHospitalOperadora[] }> {
  return apiFetch(`/hospital/${key}/regras`)
}

/** Grava a excecao do hospital nesta operadora. O backend guarda so o que
 *  difere da operadora; tudo igual remove a excecao. */
export function salvarRegrasHospital(
  hospitalKey: string, operadoraKey: string, regras: RegrasCobranca,
): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${hospitalKey}/regras/${operadoraKey}`, {
    method: 'PUT',
    body: regras,
  })
}

/** O hospital volta a seguir as regras da operadora. */
export function removerRegrasHospital(hospitalKey: string, operadoraKey: string): Promise<OkResult> {
  return apiFetch<OkResult>(`/hospital/${hospitalKey}/regras/${operadoraKey}`, { method: 'DELETE' })
}
