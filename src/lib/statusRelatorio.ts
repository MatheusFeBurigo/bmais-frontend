// Gravidade do status de relatório de um paciente, para colorir KPIs.
// Fonte única da ficha e do drawer (antes cada um tinha a sua cópia).
export type Gravidade = 'perigo' | 'atencao' | 'normal'

export function gravidadeDoStatus(sr: string | null | undefined): Gravidade {
  if (sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL') return 'perigo'
  if (sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO') return 'atencao'
  return 'normal'
}

// Status de paciente que já saiu (alta registrada ou inferida do censo).
const STATUS_ALTA = new Set(['ALTA_SEM_REL', 'ALTA_REL_VENCIDO', 'ALTA_OK', 'ALTA_AUTO'])

/** O paciente já saiu. A busca do Painel Operacional mistura altas aos
 *  internados, e cada linha se mostra pelo seu status. */
export function ehAlta(sr?: string | null): boolean {
  return STATUS_ALTA.has(sr ?? '')
}

export function corDaGravidade(g: Gravidade): string {
  if (g === 'perigo') return 'var(--danger)'
  if (g === 'atencao') return 'var(--warning)'
  return 'var(--ink-2)'
}

/** Destaque do cartão de KPI quando o paciente está sem relatório. */
export const KPI_PERIGO = {
  cartao: { background: 'var(--danger-bg)', borderColor: 'rgba(200,36,60,.2)' },
  texto: { color: 'var(--danger)' },
} as const
