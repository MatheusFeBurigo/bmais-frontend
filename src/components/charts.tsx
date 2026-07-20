// Wrappers de gráfico sobre react-chartjs-2 / Chart.js.
// Registra os elementos usados uma única vez e expõe helpers de estilo B+.

import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'

ChartJS.register(
  ArcElement, LineElement, BarElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
)

// Re-export para páginas que precisam de gráficos especializados (ex.: Gestor,
// com datasets mistos linha+barra empilhada e onClick). Importar daqui garante
// o register acima.
export { Doughnut, Line, Bar, Chart } from 'react-chartjs-2'
export { ChartJS }

// Tokens replicados do design system (Chart.js não lê CSS vars).
const GRID = '#EFF2F5'
const AXIS = '#8595A6'
const INK3 = '#3A4D5E'
const MONO = 'Geist Mono'

const monoTicks = { font: { family: MONO, size: 10 }, color: AXIS }

// ── Donut ─────────────────────────────────────────────────────────────────
export function DonutChart({ labels, data, colors }: {
  labels: string[]
  data: number[]
  colors: string[]
}) {
  const options: ChartOptions<'doughnut'> = {
    cutout: '62%',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}` } },
    },
  }
  return (
    <Doughnut
      options={options}
      data={{ labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }}
    />
  )
}

// ── Line (área) ─────────────────────────────────────────────────────────────
export function LineChart({ labels, data, color = '#155CA8' }: {
  labels: string[]
  data: number[]
  color?: string
}) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { color: GRID }, ticks: monoTicks },
      x: { grid: { display: false }, ticks: monoTicks },
    },
    plugins: { legend: { display: false } },
  }
  return (
    <Line
      options={options}
      data={{
        labels,
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: 'rgba(21,92,168,.12)',
          fill: true, tension: 0.3, pointRadius: 4,
          pointBackgroundColor: '#fff', pointBorderColor: color, pointBorderWidth: 2,
        }],
      }}
    />
  )
}

export interface BarDataset {
  label: string
  data: number[]
  color: string
}

// ── Bar (vertical agrupada ou horizontal) ────────────────────────────────────
export function BarChart({ labels, datasets, horizontal = false, legend = false }: {
  labels: string[]
  datasets: BarDataset[]
  horizontal?: boolean
  legend?: boolean
}) {
  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: horizontal
        ? { beginAtZero: true, grid: { color: GRID }, ticks: monoTicks }
        : { grid: { display: false }, ticks: { font: { size: 11 }, color: INK3 } },
      y: horizontal
        ? { grid: { display: false }, ticks: { font: { size: 11 }, color: INK3 } }
        : { beginAtZero: true, grid: { color: GRID }, ticks: monoTicks },
    },
    plugins: {
      legend: legend
        ? { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 16 } }
        : { display: false },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels,
        datasets: datasets.map((d) => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.color,
          borderRadius: 3,
        })),
      }}
    />
  )
}
