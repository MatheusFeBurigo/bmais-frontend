// Serviço da escala hospital↔profissional. Compartilhado por Configurações e
// Equipe (ambas gerenciam a mesma escala).
import { apiFetch } from '../api/client'

export interface NovaEscala {
  hospital_key: string
  hospital_nome: string
  operadora_key: string
  servico: string
  profissional_id: number
}

export function adicionarEscala(entrada: NovaEscala): Promise<unknown> {
  return apiFetch('/hospital-escala', { method: 'POST', body: entrada })
}

export function removerEscala(id: number): Promise<unknown> {
  return apiFetch(`/hospital-escala/${id}`, { method: 'DELETE' })
}
