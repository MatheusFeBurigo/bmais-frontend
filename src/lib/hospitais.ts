import type { Hospital } from '../types/api'

/** Keys de todas as operadoras que o hospital atende (vínculo N-N), com a
 *  principal legada como reserva. Nunca filtre por `h.operadora_key` sozinho:
 *  depois da unificação de 30/09, um hospital só tem UMA principal e sumia das
 *  outras operadoras que atende. */
export function operadorasDoHospital(h: Hospital): string[] {
  if (h.operadoras?.length) return h.operadoras
  return h.operadora_key ? [h.operadora_key] : []
}

export function atendeOperadora(h: Hospital, operadora: string): boolean {
  return operadorasDoHospital(h).includes(operadora)
}
