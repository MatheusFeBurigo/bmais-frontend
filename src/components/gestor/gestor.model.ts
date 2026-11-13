// Constantes de domínio/view-model da tela Gestor (faixas de permanência e
// janelas do gráfico de fluxo). Extraído de pages/Gestor.tsx.
import { COR } from './gestor.styles'
import type { PacienteDia } from '../../types/api'

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

// Filtros de situação da lista de pacientes (12/11/2026, pedido do usuário: a
// gestora quer achar quem está prorrogado, quem tem negociação e quem está em
// home care sem abrir paciente por paciente). Um recorte por vez, como as
// faixas. Acrescentar um filtro é acrescentar uma linha aqui: a barra e o
// contador se ajustam sozinhos.
export type SituacaoFiltro = '' | 'prorrogados' | 'negociacao' | 'aguardando_aceite' | 'homecare'

export const SITUACOES: Array<{
  key: Exclude<SituacaoFiltro, ''>
  label: string
  titulo: string
  aplica: (p: PacienteDia) => boolean
}> = [
  {
    key: 'prorrogados',
    label: 'Prorrogados',
    titulo: 'Internados com prorrogação aprovada que ainda não terminou, inclusive as pausadas',
    aplica: (p) => p.prorrogacao != null,
  },
  {
    key: 'negociacao',
    label: 'Negociação',
    titulo: 'Pacientes com negociação (folha rosa) num relatório aprovado',
    aplica: (p) => p.negociacao != null,
  },
  {
    key: 'aguardando_aceite',
    label: 'Aguardando aceite',
    titulo: 'A negociação mais recente ainda espera o aceite do hospital',
    aplica: (p) => p.negociacao?.aceite === 'aguardando',
  },
  {
    // Desde 13/11/2026 o home care é registrado no relatório, como a
    // prorrogação (vale o do relatório aprovado mais recente). Entram também as
    // altas antigas com o motivo Homecare (08/10 a 13/11) e quem ficou no
    // leito HOMECARE de antes de 08/10, para nada sumir da lista.
    key: 'homecare',
    label: 'Homecare',
    titulo: 'Pacientes com home care registrado no relatório (e as altas antigas com motivo Homecare)',
    aplica: (p) => p.homecare != null || p.motivo_alta === 'homecare'
      || (p.tipo_leito ?? '').toUpperCase() === 'HOMECARE',
  },
]
