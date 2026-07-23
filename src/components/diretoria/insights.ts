// Deriva os cards de "insights" a partir dos KPIs REAIS do payload da Diretoria,
// em vez de exibir rótulos fixos de features. Cada card mostra um número que já
// existe no backend e um tom que reage ao próprio valor (ex.: alerta quando > 0).
// Extraído de pages/Diretoria.tsx.
import type { DiretoriaPayload } from '../../types/api'
import type { InsightTom } from './diretoria.styles'

export interface Insight { clr: InsightTom; title: string; desc: string; status: string }

export function derivarInsights(data: DiretoriaPayload): Insight[] {
  const proximo = data.proximo_vencer || 0
  const emMon = data.em_monitoramento || 0
  const emDia = data.relatorio_em_dia || 0
  const cobertura = emMon > 0 ? Math.round((emDia / emMon) * 100) : 100
  const longa = data.longa_permanencia || 0
  const avancada = data.longa_avancada || 0

  // Variação da última semana vs. a anterior (tendência de registro de relatórios).
  const trend = data.trend_semanal || []
  const atual = trend.length > 0 ? trend[trend.length - 1] : 0
  const anterior = trend.length > 1 ? trend[trend.length - 2] : 0
  const delta = atual - anterior
  const setaTrend = delta > 0 ? '▲' : delta < 0 ? '▼' : '→'
  // A seta já carrega o sinal do delta; o número entre parênteses vem SEM sinal
  // duplicado (evita "▼ 5 (+-2)"). Positivo ganha "+" explícito; zero fica neutro.
  const deltaFmt = delta > 0 ? `+${delta}` : `${delta}`

  return [
    {
      clr: proximo > 0 ? 'warning' : 'info',
      title: 'Próximos a vencer',
      desc: 'Pacientes cujo relatório vence em 1–3 dias — priorizar visita.',
      status: `${proximo} paciente${proximo === 1 ? '' : 's'}`,
    },
    {
      clr: cobertura < 50 ? 'warning' : 'primary',
      title: 'Cobertura de relatórios',
      desc: 'Relatórios em dia sobre os pacientes em monitoramento.',
      status: `${cobertura}%`,
    },
    {
      clr: 'primary',
      title: 'Tendência semanal',
      desc: 'Relatórios registrados nesta semana vs. a anterior.',
      status: `${setaTrend} ${atual} (${deltaFmt})`,
    },
    {
      clr: avancada > 0 ? 'warning' : longa > 0 ? 'info' : 'muted',
      title: 'Longa permanência',
      desc: 'Internados acima do limite — candidatos a revisão de alta.',
      status: `${longa} longa · ${avancada} avançada`,
    },
  ]
}
