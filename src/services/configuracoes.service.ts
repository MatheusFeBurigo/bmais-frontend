// Serviço de dados do domínio "configuracoes" (operadoras + hospitais + regras).
import { apiFetch } from '../api/client'
import type { ConfiguracoesPayload, OperadoraRegras } from '../types/api'

export interface ConfiguracoesParams {
  op?: string
  hospital?: string
}

interface OkResult { ok?: boolean; salvo?: boolean; criado?: boolean }

/** Payload da tela: overview + (opcional) operadora + hospital selecionados. */
export function fetchConfiguracoes(params: ConfiguracoesParams): Promise<ConfiguracoesPayload> {
  const { op, hospital } = params
  const qs = op ? `?op=${op}${hospital ? `&hospital=${hospital}` : ''}` : ''
  return apiFetch<ConfiguracoesPayload>(`/configuracoes${qs}`)
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
