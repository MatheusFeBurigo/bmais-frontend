// Serviço de dados do domínio "diretoria" (KPIs consolidados de todas as operadoras).
import { apiFetch } from '../api/client'
import type { DiretoriaPayload } from '../types/api'

/** KPIs consolidados de todas as operadoras. */
export function fetchDiretoria(): Promise<DiretoriaPayload> {
  return apiFetch<DiretoriaPayload>('/diretoria')
}

// Export por operadora: reusa `exportarRvm` de dashboard.service (mesmo endpoint
// /export-rvm). O backend gera por operadora, não consolidado — a Diretoria
// exige a escolha explícita da operadora para não cair no default silencioso.
export { exportarRvm } from './dashboard.service'
