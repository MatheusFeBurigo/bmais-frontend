// Serviço de ações administrativas/manutenção de base (seed e limpeza).
import { apiFetch } from '../api/client'

export interface SeedDemoAdminResult {
  ok?: boolean
  pacientes_inseridos?: number
  altas_inseridas?: number
}

export interface LimparDadosResult {
  ok?: boolean
  removidos?: { internacoes?: number; relatorios?: number }
}

export function popularDemo(): Promise<SeedDemoAdminResult> {
  return apiFetch<SeedDemoAdminResult>('/seed-demo', { method: 'POST' })
}

export function limparDados(): Promise<LimparDadosResult> {
  return apiFetch<LimparDadosResult>('/limpar-dados', { method: 'POST' })
}
