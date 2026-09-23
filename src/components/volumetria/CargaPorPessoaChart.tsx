// Barras horizontais: uma por pessoa COM área definida, em HORAS estimadas de
// análise, ordenadas pelo backend (sobrecarga → atenção → normal, fila mais
// longa primeiro). Cor = nível absoluto (rótulo na legenda abaixo e no
// tooltip — a cor nunca vai sozinha). Clicar numa barra seleciona a pessoa,
// como `HospBar` do Gestor faz com hospital; a selecionada fica em cor cheia e
// as demais esmaecem.
//
// O valor no fim de cada barra sai de um plugin inline (Chart.js não o
// desenha por padrão) em tom de texto, não na cor da série.
import type { ChartOptions, Plugin } from 'chart.js'
import type { VolumetriaGrupo, VolumetriaPessoa } from '../../types/api'
import { Bar } from '../charts'
import { pointerCursor } from '../gestor/charts'
import { AXIS, GRID, INK, MONO, NOME_FONT } from '../gestor/gestor.styles'
import {
  NIVEIS, NIVEL_HEX, NIVEL_LABEL, descreverLimiares, fmt1, fmtDias, fmtHoras,
} from './volumetria.model'

const ALTURA_LINHA = 34
const ALTURA_MIN = 160

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

const valoresNoFim: Plugin<'bar'> = {
  id: 'vol-valores-no-fim',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0)
    const dados = (chart.data.datasets[0]?.data ?? []) as number[]
    const { ctx } = chart
    ctx.save()
    ctx.font = `600 ${MONO.size}px "${MONO.family}"`
    ctx.fillStyle = INK
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    meta.data.forEach((el, i) => {
      const v = dados[i]
      if (v == null) return
      ctx.fillText(`${fmt1(v)} h`, el.x + 6, el.y)
    })
    ctx.restore()
  },
}

export default function CargaPorPessoaChart({ grupo, pessoas, selecionadoId, onSelecionar }: {
  grupo: VolumetriaGrupo
  pessoas: VolumetriaPessoa[]
  selecionadoId: string | null
  onSelecionar: (userId: string) => void
}) {
  if (pessoas.length === 0) {
    return (
      <div className="vol-vazio">
        Ninguém com área definida ainda. Escolha uma pessoa na faixa abaixo e adicione hospitais a ela.
      </div>
    )
  }

  const horas = pessoas.map((p) => p.horas ?? 0)
  const corBarra = (ctx: { dataIndex: number }) => {
    const p = pessoas[ctx.dataIndex]
    const cheia = NIVEL_HEX[p?.nivel ?? 'normal']
    const esmaecida = !!selecionadoId && p?.user_id !== selecionadoId
    return esmaecida ? rgba(cheia, 0.3) : cheia
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_evt, els) => { if (els.length) onSelecionar(pessoas[els[0].index].user_id) },
    onHover: pointerCursor,
    layout: { padding: { right: 60 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (c) => {
            const p = pessoas[c.dataIndex]
            const partes = [
              fmtHoras(p.horas),
              `${fmtDias(p.dias_fila)} de fila`,
              `${p.total_pendencias ?? 0} ${p.total_pendencias === 1 ? 'caso' : 'casos'}`,
            ]
            if (p.pressao_pct != null) partes.push(`prazo ${p.pressao_pct}%`)
            partes.push(NIVEL_LABEL[p.nivel ?? 'normal'])
            return partes.join(' · ')
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true, grid: { color: GRID }, border: { display: false },
        ticks: { font: MONO, color: AXIS, precision: 0, callback: (v) => `${v} h` },
      },
      y: { grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK, crossAlign: 'far' as const } },
    },
  }

  return (
    <>
      <div style={{ height: Math.max(ALTURA_MIN, ALTURA_LINHA * pessoas.length) }}>
        <Bar
          options={options}
          plugins={[valoresNoFim]}
          data={{
            labels: pessoas.map((p) => (p.nome.length > 28 ? p.nome.slice(0, 27) + '…' : p.nome)),
            datasets: [{
              label: 'Horas estimadas',
              data: horas,
              backgroundColor: corBarra,
              borderRadius: 4,
              barPercentage: 0.78,
              categoryPercentage: 0.86,
            }],
          }}
        />
      </div>
      <div className="vol-legenda" aria-label="Legenda das cores">
        {NIVEIS.map((n) => (
          <span key={n}><i style={{ background: NIVEL_HEX[n] }} />{NIVEL_LABEL[n]}</span>
        ))}
        <span style={{ marginLeft: 'auto' }}>{descreverLimiares(grupo)}</span>
      </div>
    </>
  )
}
