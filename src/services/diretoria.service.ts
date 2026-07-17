// Serviço de dados do domínio "diretoria" (KPIs consolidados de todas as operadoras).
import { apiFetch, apiDownload } from '../api/client'
import type { DiretoriaPayload } from '../types/api'

export interface SeedDemoResult {
  ok?: boolean
  pacientes_inseridos?: number
  relatorios_adicionados?: number
}

/** KPIs consolidados de todas as operadoras. */
export function fetchDiretoria(): Promise<DiretoriaPayload> {
  return apiFetch<DiretoriaPayload>('/diretoria')
}

/** Exporta a planilha consolidada (todas as operadoras). */
export function exportarRvmGeral(): Promise<void> {
  return apiDownload('/export-rvm', 'CONTROLE_AUDITORIA.xlsx')
}

/** Insere dados de demonstração (ambiente de avaliação). */
export function inserirSeedDemo(): Promise<SeedDemoResult> {
  return apiFetch<SeedDemoResult>('/seed-demo', { method: 'POST' })
}
