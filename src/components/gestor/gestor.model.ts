// Constantes de domínio/view-model da tela Gestor (faixas de permanência e
// janelas do gráfico de fluxo). Extraído de pages/Gestor.tsx.
import { COR } from './gestor.styles'

export const FAIXA_KEYS = ['0_9', '10_29', '30p'] as const

export type FaixaFiltro = '' | '0_9' | '10_29' | '30p' | 'altas'

// Rótulo e cor de cada faixa de permanência (para o bloco de lista sob o donut).
export const FAIXA_INFO: Record<'0_9' | '10_29' | '30p', { label: string; cor: string }> = {
  '0_9': { label: 'Até 9 dias', cor: COR.azul },
  '10_29': { label: '10 a 29 dias', cor: COR.laranja },
  '30p': { label: '30+ dias', cor: COR.vermelho },
}

// Janelas do gráfico de fluxo: rótulo por extenso (pill) + descrição p/ o título.
// 30d agrupa por dia; 90d/6m/1a agrupam por MÊS (colunas mensais). Clicar numa
// coluna ancora o painel no período dela (o dia em 30d; o mês nas demais).
export const JANELAS = [
  { key: '30d', pill: '30 dias', titulo: 'últimos 30 dias' },
  { key: '90d', pill: '90 dias', titulo: 'últimos 90 dias' },
  { key: '6m', pill: '6 meses', titulo: 'últimos 6 meses' },
  { key: '1a', pill: '1 ano', titulo: 'último ano' },
] as const
