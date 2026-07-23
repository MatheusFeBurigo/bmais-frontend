// Gráficos Chart.js da tela Gestor (apresentação pura). Extraídos de
// pages/Gestor.tsx — cada um recebe `m` (métricas) + seleção/callbacks e desenha.
import type { ChartOptions } from 'chart.js'
import type { GestorMetrics } from '../../types/api'
import { Chart, Doughnut, Bar } from '../charts'
import { GRID, AXIS, INK, NOME_FONT, COR, MONO, AXIS_TITLE } from './gestor.styles'
import { FAIXA_KEYS } from './gestor.model'

export function pointerCursor(evt: { native: Event | null }, els: unknown[]) {
  const target = evt.native?.target as HTMLElement | undefined
  if (target) target.style.cursor = els.length ? 'pointer' : 'default'
}

// Helpers compartilhados pelos dois gráficos do fluxo (ocupação e fluxo diário):
// clique-no-bucket por índice e ticks do eixo X com o bucket selecionado em
// destaque. Clicar numa coluna ancora o painel no PERÍODO daquela coluna (1 dia
// em 30d/90d, a semana em 6m, o mês em 1a) — o backend expõe `ini`/`fim` por item.
function usarSerieFluxo(m: GestorMetrics, periodoAtivo: boolean,
                        onBucket?: (item: GestorMetrics['serie_30d'][number]) => void) {
  const serie = m.serie_30d
  // Bucket selecionado = aquele cujo intervalo [ini,fim] casa com o período
  // ativo do painel (m.dia_inicio/m.dia_fim). Só destaca quando há período ativo
  // (dia histórico ou intervalo) — no modo geral/hoje nada fica selecionado.
  const idxSel = periodoAtivo
    ? serie.findIndex((s) => s.ini === m.dia_inicio && s.fim === m.dia_fim)
    : -1
  const onClick = onBucket
    ? (evt: unknown, _els: unknown, chart: { getElementsAtEventForMode: (e: Event, m: string, o: object, u: boolean) => Array<{ index: number }> }) => {
        const pts = chart.getElementsAtEventForMode(evt as Event, 'index', { intersect: false }, true)
        if (pts.length) onBucket(serie[pts[0].index])
      }
    : undefined
  const xTicks = {
    maxRotation: 0, autoSkip: true, maxTicksLimit: 10,
    color: (c: { index: number }) => (c.index === idxSel ? COR.azul : AXIS),
    font: (c: { index: number }) => (c.index === idxSel ? { ...MONO, weight: 'bold' as const } : MONO),
  }
  return { idxSel, onClick, xTicks }
}

// 1a. OCUPAÇÃO (estoque): linha de internados — "quantos leitos ocupados por
// dia". Eixo único, própria escala. Separado do fluxo diário porque é uma
// grandeza distinta (nível acumulado, não movimento).
export function OcupacaoChart({ m, periodoAtivo, onBucket }: {
  m: GestorMetrics; periodoAtivo: boolean; onBucket?: (item: GestorMetrics['serie_30d'][number]) => void
}) {
  const serie = m.serie_30d
  const { idxSel, onClick, xTicks } = usarSerieFluxo(m, periodoAtivo, onBucket)
  const options: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick, onHover: onClick ? pointerCursor : undefined,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, titleFont: { size: 13 }, bodyFont: { size: 13 } } },
    scales: {
      y: { beginAtZero: true, border: { display: false }, grid: { color: GRID }, ticks: { font: MONO, color: AXIS, maxTicksLimit: 6, precision: 0 } },
      x: { grid: { display: false }, border: { color: GRID }, ticks: xTicks },
    },
  }
  return (
    <Chart
      type="line"
      options={options}
      data={{
        labels: serie.map((s) => s.label),
        datasets: [
          { label: 'Internados', data: serie.map((s) => s.internados), borderColor: COR.azul, borderWidth: 2, backgroundColor: COR.azulBg, fill: true, tension: 0.35, pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === idxSel ? 4 : 0), pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: COR.azul, pointBorderWidth: 2 },
        ],
      }}
    />
  )
}

// 1b. FLUXO DIÁRIO (fluxo): entradas vs altas em barras AGRUPADAS (não
// empilhadas — têm sinais opostos sobre a ocupação) + linha de SALDO líquido
// (entradas − altas), que é o que de fato move a ocupação. Eixo próprio (0..~10).
export function FluxoDiarioChart({ m, periodoAtivo, onBucket }: {
  m: GestorMetrics; periodoAtivo: boolean; onBucket?: (item: GestorMetrics['serie_30d'][number]) => void
}) {
  const serie = m.serie_30d
  const { idxSel, onClick, xTicks } = usarSerieFluxo(m, periodoAtivo, onBucket)
  // Gradiente vertical (cor viva no topo → transparente na base) para dar volume
  // às barras. Cai para cor sólida enquanto o layout do canvas não existe.
  const grad = (top: string, bottom: string, solido: string) =>
    (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } }; dataIndex: number }) => {
      const area = ctx.chart.chartArea
      const atenua = idxSel >= 0 && ctx.dataIndex !== idxSel
      if (!area) return solido
      const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
      g.addColorStop(0, atenua ? bottom : top)
      g.addColorStop(1, bottom)
      return g
    }
  const options: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick, onHover: onClick ? pointerCursor : undefined,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 14, usePointStyle: true, font: AXIS_TITLE } },
      tooltip: { mode: 'index', intersect: false, titleFont: { size: 13 }, bodyFont: { size: 13 } },
    },
    scales: {
      // Sem beginAtZero: o SALDO pode ser negativo (dias com mais altas que
      // entradas = ocupação cai). A linha do grid no 0 fica mais marcada para
      // separar visualmente "sobe" (acima) de "desce" (abaixo).
      y: {
        border: { display: false },
        grid: {
          color: (c: { tick: { value: number } }) => (c.tick.value === 0 ? AXIS : GRID),
          lineWidth: (c: { tick: { value: number } }) => (c.tick.value === 0 ? 1.5 : 1),
        },
        ticks: { font: MONO, color: AXIS, maxTicksLimit: 5, precision: 0 },
      },
      x: { grid: { display: false }, border: { color: GRID }, ticks: xTicks },
    },
  }
  // Ponto do saldo por sinal: negativo = laranja (ocupação caiu naquele dia).
  const corPontoSaldo = (ctx: { dataIndex: number }) => {
    const s = serie[ctx.dataIndex]
    return (s ? s.entradas - s.altas : 0) < 0 ? COR.laranja : COR.roxo
  }
  return (
    <Chart
      type="bar"
      options={options}
      data={{
        labels: serie.map((s) => s.label),
        datasets: [
          // Barras AGRUPADAS lado a lado (não empilhadas): o olho compara entra x sai.
          // Cores vivas com gradiente vertical; cantos bem arredondados.
          { type: 'bar' as const, label: 'Entradas', data: serie.map((s) => s.entradas), backgroundColor: grad(COR.verde, COR.verdeBg, COR.verde), borderRadius: 5, borderSkipped: false, categoryPercentage: 0.72, barPercentage: 0.92, order: 3 },
          { type: 'bar' as const, label: 'Altas', data: serie.map((s) => s.altas), backgroundColor: grad(COR.laranja, COR.laranjaBg, COR.laranja), borderRadius: 5, borderSkipped: false, categoryPercentage: 0.72, barPercentage: 0.92, order: 2 },
          // Linha de SALDO (entradas − altas): positivo = ocupação sobe. Roxo
          // profundo por cima das barras, SEM área de preenchimento — a área
          // translúcida cobria e desbotava as cores das barras.
          { type: 'line' as const, label: 'Saldo (entradas − altas)', data: serie.map((s) => s.entradas - s.altas), borderColor: COR.roxo, borderWidth: 2.5, fill: false, tension: 0.35, pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === idxSel ? 5 : 2.5), pointHoverRadius: 6, pointBackgroundColor: '#fff', pointBorderColor: corPontoSaldo, pointBorderWidth: 2, order: 1 },
        ],
      }}
    />
  )
}

// 2. Donut faixas — clique filtra a tabela
export function FaixasDonut({ m, onFaixa }: { m: GestorMetrics; onFaixa: (f: '0_9' | '10_29' | '30p') => void }) {
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    onClick: (_evt, els) => { if (els.length) onFaixa(FAIXA_KEYS[els[0].index]) },
    onHover: pointerCursor,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: AXIS_TITLE } } },
  }
  return (
    <Doughnut
      options={options}
      data={{
        labels: ['Até 9 dias', '10–29 dias', '30+ dias'],
        datasets: [{ data: [m.hoje.f0_9, m.hoje.f10_29, m.hoje.f30], backgroundColor: [COR.azul, COR.laranja, COR.vermelho], borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
      }}
    />
  )
}

// 4. Barras horizontais por hospital (top 12) — clique filtra por hospital.
// Cor sólida única (mesmo conceito dos gráficos de operadora/região). Quando um
// hospital está filtrado (`selKey`), ele fica em cor cheia e os demais esmaecem.
export function HospBar({ m, selKey, onHosp }: { m: GestorMetrics; selKey: string; onHosp: (key: string) => void }) {
  const hosps = m.por_hospital.slice(0, 12)
  const corBarra = (ctx: { dataIndex: number }) =>
    !selKey || hosps[ctx.dataIndex]?.key === selKey ? COR.azul : 'rgba(26,93,168,.30)'
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false }, // clicar em qualquer ponto da linha
    onClick: (_evt, els) => { if (els.length) onHosp(hosps[els[0].index].key) },
    onHover: pointerCursor,
    layout: { padding: { right: 28 } }, // espaço p/ o valor no fim da barra
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0 } },
      // Nomes dos hospitais em tom escuro e fonte maior — leitura mais fácil.
      y: { grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK, crossAlign: 'far' as const } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        // Menos truncação (34) e barras um pouco mais grossas.
        labels: hosps.map((h) => (h.nome.length > 34 ? h.nome.slice(0, 33) + '…' : h.nome)),
        datasets: [{
          label: 'Internados',
          data: hosps.map((h) => h.internados),
          backgroundColor: corBarra,
          borderRadius: 4,
          barPercentage: 0.82,
          categoryPercentage: 0.86,
        }],
      }}
    />
  )
}

// 5. Barras por região — clique filtra por região (ignora "Sem região").
// Destaca a região filtrada (`selNome`) e esmaece as demais.
export function RegBar({ m, selNome, onReg }: { m: GestorMetrics; selNome: string; onReg: (nome: string) => void }) {
  const regs = m.por_regiao
  const corBarra = (ctx: { dataIndex: number }) =>
    !selNome || regs[ctx.dataIndex]?.nome === selNome ? COR.roxo : 'rgba(107,52,184,.30)'
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false }, // clicar em qualquer ponto da linha
    onClick: (_evt, els) => {
      if (els.length && regs[els[0].index].nome !== 'Sem região') onReg(regs[els[0].index].nome)
    },
    onHover: pointerCursor,
    plugins: { legend: { display: false }, tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } } },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0 } },
      y: { grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: regs.map((r) => r.nome),
        datasets: [{ label: 'Internados', data: regs.map((r) => r.internados), backgroundColor: corBarra, borderRadius: 4, barPercentage: 0.82, categoryPercentage: 0.86 }],
      }}
    />
  )
}
