// Serviço de ações administrativas/manutenção de base (limpeza).
import { apiFetch } from '../api/client'

export interface LimparDadosResult {
  ok?: boolean
  removidos?: { internacoes?: number; relatorios?: number }
}

export function limparDados(): Promise<LimparDadosResult> {
  return apiFetch<LimparDadosResult>('/limpar-dados', { method: 'POST' })
}
