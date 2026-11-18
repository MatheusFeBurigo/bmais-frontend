// Módulo 2 > Ausências (17/11/2026, migration 0065): os pedidos de ausência que
// o médico e o enfermeiro fazem no App (Minha agenda). A coordenação aprova ou
// recusa; aprovado, os fechamentos do auditor naquele dia viram "troca pedida".
// Backend: routes/ausencias.py.
import { apiFetch } from '../api/client'

/** cancelado = o próprio auditor desistiu do pedido no App. */
export type EstadoAusencia = 'pendente' | 'aprovado' | 'recusado' | 'cancelado'

export interface DecisaoAusencia {
  por_nome: string | null
  em: string | null
  motivo: string | null
}

/** Um fechamento do auditor no dia pedido (contexto para decidir). */
export interface FechamentoDoDia {
  id: number
  hospital_nome: string
  operadora_nome: string
  hora: string
  papel: 'medico' | 'enfermeiro'
}

export interface PedidoAusencia {
  id: number
  profissional_id: number
  profissional_nome: string
  /** 'M' médico, 'E' enfermeiro. */
  tipo: string | null
  dia: string
  motivo: string
  estado: EstadoAusencia
  pedido_em: string | null
  decisao: DecisaoAusencia | null
  fechamentos: FechamentoDoDia[]
}

export interface ListaAusencias {
  /** Falso enquanto a migration 0065 não estiver no banco. */
  disponivel: boolean
  pode_decidir: boolean
  hoje: string
  pedidos: PedidoAusencia[]
}

export function fetchAusencias(): Promise<ListaAusencias> {
  return apiFetch('/ausencias')
}

export function decidirAusencia(id: number, body: { aprovar: boolean; motivo?: string }):
  Promise<{ pedido: PedidoAusencia; fechamentos_afetados?: number }> {
  return apiFetch(`/ausencias/${id}/decidir`, { method: 'POST', body })
}
