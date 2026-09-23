// Serviço da escala hospital↔profissional. Compartilhado por Configurações e
// Equipe (ambas gerenciam a mesma escala).
import { apiFetch } from '../api/client'

/** Um hospital da escala, escolhido no formulário (sem o profissional): é o
 *  que a modal de cadastro acumula antes de o profissional existir. */
export interface EntradaEscala {
  hospital_key: string
  hospital_nome: string
  operadora_key: string
  servico: string
}

export interface NovaEscala extends EntradaEscala {
  profissional_id: number
}

export function adicionarEscala(entrada: NovaEscala): Promise<unknown> {
  return apiFetch('/hospital-escala', { method: 'POST', body: entrada })
}

export function removerEscala(id: number): Promise<unknown> {
  return apiFetch(`/hospital-escala/${id}`, { method: 'DELETE' })
}
