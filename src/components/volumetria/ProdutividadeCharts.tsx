// Gráficos de produtividade da Distribuição de tarefas.
//
// "Concluída" é o gesto que tira a tarefa do quadro, com o e-mail de quem o
// fez: relatório gravado (técnico) ou cobrança marcada como cobrada
// (administrativo). O sistema não mede esforço, só esses registros.
//
// Cores por IDENTIDADE e iguais nos três gráficos: azul = abertas agora,
// verde = concluídas. Laranja e vermelho ficam fora: nesta tela eles já
// significam "atenção" e "sobrecarga". O par passou no validador de
// daltonismo (pior par ΔE 17,4 protan, 18,3 visão normal).
import type { ChartOptions } from 'chart.js'
import type { VolumetriaGrupo } from '../../types/api'
import { Bar, Line } from '../charts'
import { pointerCursor } from '../gestor/charts'
import { AXIS, GRID, INK, MONO, NOME_FONT } from '../gestor/gestor.styles'
import { COR_ABERTAS, COR_CONCLUIDAS, rotuloGrupo } from './volumetria.model'

const ALTURA_PESSOA = 46
const ALTURA_MIN = 170

function curto(nome: string): string {
  return nome.length > 26 ? nome.slice(0, 25) + '…' : nome
}

function Legenda({ fim }: { fim?: string }) {
  return (
    <div className="vol-legenda" aria-label="Legenda">
      <span><i style={{ background: COR_ABERTAS }} />Abertas agora</span>
      <span><i style={{ background: COR_CONCLUIDAS }} />Concluídas</span>
      {fim && <span style={{ marginLeft: 'auto' }}>{fim}</span>}
    </div>
  )
}

const eixoValor = {
  beginAtZero: true, grid: { color: GRID }, border: { display: false },
  ticks: { font: MONO, color: AXIS, precision: 0 },
}
const eixoNome = {
  grid: { display: false }, border: { color: GRID },
  ticks: { font: NOME_FONT, color: INK, crossAlign: 'far' as const },
}
const dataset = (label: string, data: number[], cor: string) => ({
  label, data, backgroundColor: cor, borderRadius: 4,
  // Folga entre as duas barras da mesma pessoa (o "espaço de superfície").
  borderColor: '#fff', borderWidth: { top: 1, bottom: 1 },
  barPercentage: 0.82, categoryPercentage: 0.78,
})

/** Abertas agora x concluídas na janela, uma linha por pessoa. */
export function ProdutividadePorPessoa({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  // Quem tem área definida, e também quem não tem mas entregou algo: trabalho
  // feito aparece mesmo sem hospital atribuído.
  const pessoas = grupo.pessoas
    .filter((p) => !p.sem_vinculo || p.concluidas > 0)
    .sort((a, b) => b.concluidas - a.concluidas || (b.total_pendencias ?? 0) - (a.total_pendencias ?? 0))
  if (pessoas.length === 0) {
    return <div className="vol-vazio">Ninguém no grupo ainda.</div>
  }
  const dias = grupo.produtividade.dias
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_e, els) => { if (els.length) onAbrir(pessoas[els[0].index].user_id) },
    onHover: pointerCursor,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 13 }, bodyFont: { size: 13 },
        callbacks: {
          title: (c) => pessoas[c[0].dataIndex]?.nome ?? '',
          label: (c) => {
            const p = pessoas[c.dataIndex]
            if (c.datasetIndex === 0) {
              return p.sem_vinculo ? 'Abertas: sem área definida' : `Abertas agora: ${c.parsed.x}`
            }
            return `Concluídas em ${dias} dias: ${c.parsed.x}`
          },
        },
      },
    },
    scales: { x: eixoValor, y: eixoNome },
  }
  return (
    <>
      <div style={{ height: Math.max(ALTURA_MIN, ALTURA_PESSOA * pessoas.length) }}>
        <Bar
          options={options}
          data={{
            labels: pessoas.map((p) => curto(p.nome)),
            datasets: [
              dataset('Abertas agora', pessoas.map((p) => p.total_pendencias ?? 0), COR_ABERTAS),
              dataset(`Concluídas em ${dias} dias`, pessoas.map((p) => p.concluidas), COR_CONCLUIDAS),
            ],
          }}
        />
      </div>
      <Legenda fim={`Concluídas nos últimos ${dias} dias`} />
    </>
  )
}

function diaCurto(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Entregas do grupo por dia, na janela inteira (dias sem entrega = 0). */
export function ConcluidasPorDia({ grupo }: { grupo: VolumetriaGrupo }) {
  const { por_dia: serie, total, dias } = grupo.produtividade
  if (total === 0) {
    return (
      <div className="vol-vazio">
        Nenhuma entrega registrada nos últimos {dias} dias.
      </div>
    )
  }
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    // Crosshair: o tooltip segue o dia mais próximo, sem precisar mirar o ponto.
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 13 }, bodyFont: { size: 13 }, displayColors: false,
        callbacks: {
          title: (c) => diaCurto(serie[c[0].dataIndex].dia),
          label: (c) => `${c.parsed.y} ${c.parsed.y === 1 ? 'concluída' : 'concluídas'}`,
        },
      },
    },
    scales: {
      y: eixoValor,
      x: {
        grid: { display: false }, border: { color: GRID },
        ticks: { font: MONO, color: AXIS, maxTicksLimit: 8, maxRotation: 0 },
      },
    },
  }
  return (
    <div style={{ height: 220 }}>
      <Line
        options={options}
        data={{
          labels: serie.map((d) => diaCurto(d.dia)),
          datasets: [{
            label: 'Concluídas',
            data: serie.map((d) => d.concluidas),
            borderColor: COR_CONCLUIDAS,
            backgroundColor: COR_CONCLUIDAS,
            borderWidth: 2,
            // Monotônica: a curva não inventa valores abaixo de zero entre os dias.
            cubicInterpolationMode: 'monotone',
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
          }],
        }}
      />
    </div>
  )
}

/** Uma barra dupla por equipe: o que está aberto e o que foi concluído. Só
 *  faz sentido para quem vê mais de uma equipe (o admin). */
export function EntreEquipes({ grupos }: { grupos: VolumetriaGrupo[] }) {
  const dias = grupos[0]?.produtividade.dias ?? 30
  const rotulo = (g: VolumetriaGrupo) => {
    const n = g.pessoas.length
    return `${rotuloGrupo(g.papel).plural} (${n} ${n === 1 ? 'pessoa' : 'pessoas'})`
  }
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 13 }, bodyFont: { size: 13 },
        callbacks: {
          afterBody: (c) => {
            const g = grupos[c[0].dataIndex]
            const n = g.pessoas.length
            return n > 0 ? `Por pessoa: ${Math.round(g.total_pendencias / n)} abertas` : ''
          },
        },
      },
    },
    scales: { x: eixoValor, y: eixoNome },
  }
  return (
    <>
      <div style={{ height: Math.max(140, 70 * grupos.length) }}>
        <Bar
          options={options}
          data={{
            labels: grupos.map(rotulo),
            datasets: [
              dataset('Abertas agora', grupos.map((g) => g.total_pendencias), COR_ABERTAS),
              dataset(`Concluídas em ${dias} dias`,
                grupos.map((g) => g.produtividade.total + g.produtividade.fora_do_grupo),
                COR_CONCLUIDAS),
            ],
          }}
        />
      </div>
      <Legenda fim={`Concluídas nos últimos ${dias} dias`} />
    </>
  )
}
