// Constantes de estilo/paleta da tela Diretoria. Extraído de pages/Diretoria.tsx.

export const DONUT_LABELS = ['Sem Rel.', 'Vencido', 'Próx. Vencer', 'Em Dia', 'Aguardando']
export const DONUT_COLORS = ['#C8243C', '#D9690C', '#B58606', '#0E7A53', '#1F5DAA']
export const HBAR_PALETTE = ['#062E5C', '#0A3E78', '#155CA8', '#1F6FBE', '#3F89D0', '#5FA0DC', '#7FB1E0', '#A9CCEC']

export type InsightTom = 'info' | 'warning' | 'primary' | 'muted'

export const INTEL_COLORS: Record<InsightTom, [string, string]> = {
  info: ['var(--info-bg)', 'var(--info)'],
  warning: ['var(--warning-bg)', 'var(--warning)'],
  primary: ['var(--primary-soft)', 'var(--primary)'],
  muted: ['var(--surface-3)', 'var(--muted)'],
}
