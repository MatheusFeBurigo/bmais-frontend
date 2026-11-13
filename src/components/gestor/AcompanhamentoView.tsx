// Aba "Acompanhamento" do Painel do Gestor (13/11/2026, pedido do usuário: "uma
// parte gráfica somente para os pacientes de prorrogação, home care e etc.").
// Só quem está prorrogado, em negociação (folha rosa) ou em home care. Segue os
// filtros do painel (operadora, hospital, dia ou período); os KPIs recortam a
// lista de baixo, como na visão geral. As contas ficam em acompanhamento.model.
import type { ChartOptions } from 'chart.js'
import type { GestorMetrics, PacienteDia } from '../../types/api'
import { KpiCard } from '../ui'
import { Bar } from '../charts'
import TabelaPacientes from './TabelaPacientes'
import { GRID, AXIS, INK, NOME_FONT, MONO, AXIS_TITLE } from './gestor.styles'
import { SITUACOES, type FaixaFiltro, type SituacaoFiltro } from './gestor.model'
import { pointerCursor } from './charts'
import { ACEITES_FOLHA_ROSA } from '../paciente/SecaoFolhaRosa'
import {
  COR_SITUACAO, FAIXAS_VENCIMENTO, emAcompanhamento, ehHomecare, mediaDias,
  porHospital, resumoHomecare, resumoNegociacao, vencimentos,
  type HospitalAcompanhamento,
} from './acompanhamento.model'

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
const CINZA = '#8595A6'

// ── Gráficos ─────────────────────────────────────────────────────────────

/** Situações por hospital, empilhadas. Clique numa barra filtra o painel pelo
 *  hospital (filtro global, como na visão geral). */
function SituacaoHospBar({ hosps, onHosp }: { hosps: HospitalAcompanhamento[]; onHosp: (key: string) => void }) {
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_evt, els) => { if (els.length) onHosp(hosps[els[0].index].key) },
    onHover: pointerCursor,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 14, usePointStyle: true, font: AXIS_TITLE } },
      tooltip: {
        titleFont: { size: 13 }, bodyFont: { size: 13 }, footerFont: { size: 12, weight: 'normal' },
        filter: (item) => (item.raw as number) > 0,
        callbacks: {
          title: (items) => hosps[items[0]?.dataIndex]?.nome ?? '',
          footer: (items) => {
            const h = hosps[items[0]?.dataIndex]
            return h ? plural(h.pacientes, 'paciente', 'pacientes') : ''
          },
        },
      },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0 } },
      y: { stacked: true, grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK, crossAlign: 'far' as const } },
    },
  }
  // Borda branca de 2px: separa os segmentos empilhados sem contorno escuro.
  const serie = (label: string, cor: string, data: number[]) => ({
    label, data, backgroundColor: cor, borderColor: '#fff', borderWidth: 2,
    borderSkipped: false as const, borderRadius: 3, barPercentage: 0.8, categoryPercentage: 0.86,
    // Com um hospital só (filtro ativo) a barra não vira um bloco.
    maxBarThickness: 24,
  })
  return (
    <Bar
      options={options}
      data={{
        labels: hosps.map((h) => (h.nome.length > 30 ? h.nome.slice(0, 29) + '…' : h.nome)),
        datasets: [
          serie('Prorrogação', COR_SITUACAO.prorrogacao, hosps.map((h) => h.prorrogacao)),
          serie('Negociação', COR_SITUACAO.negociacao, hosps.map((h) => h.negociacao)),
          serie('Home care', COR_SITUACAO.homecare, hosps.map((h) => h.homecare)),
        ],
      }}
    />
  )
}

/** Quando as prorrogações terminam, contado do dia analisado. Uma série só
 *  (azul da prorrogação); a pausada fica em cinza porque não está correndo. */
function VencimentoBar({ dados }: { dados: Record<string, number> }) {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 13 }, bodyFont: { size: 13 },
        callbacks: { label: (ctx) => ` ${plural(ctx.raw as number, 'prorrogação', 'prorrogações')}` },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0, maxTicksLimit: 5 } },
      x: { grid: { display: false }, border: { color: GRID }, ticks: { font: { size: 12 }, color: INK } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: FAIXAS_VENCIMENTO.map((f) => f.label),
        datasets: [{
          label: 'Prorrogações',
          data: FAIXAS_VENCIMENTO.map((f) => dados[f.key] ?? 0),
          backgroundColor: FAIXAS_VENCIMENTO.map((f) => (f.key === 'pausada' ? CINZA : COR_SITUACAO.prorrogacao)),
          borderRadius: 4, borderSkipped: 'start', barPercentage: 0.7, categoryPercentage: 0.8, maxBarThickness: 48,
        }],
      }}
    />
  )
}

/** Lista de medidores: nome, barra e número por linha, todas sobre a mesma
 *  base. Serve a contagens pequenas, onde um gráfico de pizza não diz nada. */
function Medidores({ itens, base, cor }: {
  itens: Array<{ key: string; label: string; total: number; detalhe?: string; alerta?: boolean }>
  base: number
  cor: string
}) {
  return (
    <ul className="acomp-meters">
      {itens.map((it) => (
        <li key={it.key} className={it.total === 0 ? 'zero' : undefined}>
          <div className="acomp-meter-top">
            <span className={`acomp-meter-nome${it.alerta && it.total > 0 ? ' alerta' : ''}`}>{it.label}</span>
            <span className="acomp-meter-val">
              <b className="mono">{it.total}</b>
              {base > 0 && <span> de {base}</span>}
            </span>
          </div>
          <div className="acomp-meter-track" style={{ background: `${cor}1F` }}>
            <div className="acomp-meter-fill" style={{ width: `${base > 0 ? (it.total / base) * 100 : 0}%`, background: cor }} />
          </div>
          {it.detalhe && <div className="acomp-meter-det">{it.detalhe}</div>}
        </li>
      ))}
    </ul>
  )
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="empty-state acomp-vazio">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 'var(--t-sm)' }}>{texto}</div>
    </div>
  )
}

// ── Tela ─────────────────────────────────────────────────────────────────

export default function AcompanhamentoView({
  m, situacao, onSituacao, contagens, faixa, onHospital, onSelecionar, onPrefetch,
}: {
  m: GestorMetrics
  situacao: SituacaoFiltro
  onSituacao: (s: SituacaoFiltro) => void
  contagens: Record<Exclude<SituacaoFiltro, ''>, number>
  faixa: FaixaFiltro
  onHospital: (key: string) => void
  onSelecionar: (id: number) => void
  onPrefetch?: (id: number) => void
}) {
  const todos = m.pacientes_dia.filter(emAcompanhamento)
  const venc = vencimentos(todos, m.dia)
  const neg = resumoNegociacao(todos, m.dia)
  const hc = resumoHomecare(todos)
  const hosps = porHospital(todos)
  const mediaHc = mediaDias(todos, ehHomecare)
  const terminamLogo = venc.hoje + venc['1_3']

  // A lista: a situação escolhida num KPI e, se houver, a faixa de permanência
  // que veio da visão geral (o chip dela segue no topo).
  const sit = SITUACOES.find((s) => s.key === situacao)
  let lista: PacienteDia[] = sit ? todos.filter(sit.aplica) : todos
  if (faixa === 'altas') lista = lista.filter((p) => p.situacao === 'ALTA')
  else if (faixa) lista = lista.filter((p) => p.faixa === faixa && p.situacao === 'INTERNADO')

  const kpis = (
    <div className="kpi-grid acomp-kpis">
      <KpiCard variant="neutral" label="Em acompanhamento" value={todos.length}
        meta="pacientes, sem repetir" active={situacao === ''} onClick={() => onSituacao('')} />
      <KpiCard variant="info" label="Prorrogados" value={contagens.prorrogados}
        meta={terminamLogo > 0 ? `${plural(terminamLogo, 'termina', 'terminam')} em até 3 dias`
          : venc.pausada > 0 ? plural(venc.pausada, 'pausada', 'pausadas') : 'prorrogação em curso'}
        active={situacao === 'prorrogados'} onClick={() => onSituacao('prorrogados')} />
      <KpiCard variant="rosa" label="Negociação" value={contagens.negociacao}
        meta={neg.diarias > 0 ? plural(neg.diarias, 'diária negociada', 'diárias negociadas') : 'folha rosa aprovada'}
        active={situacao === 'negociacao'} onClick={() => onSituacao('negociacao')} />
      <KpiCard variant="warning" label="Aguardando aceite" value={contagens.aguardando_aceite}
        meta={neg.esperaMaisLonga != null ? `a mais antiga há ${plural(neg.esperaMaisLonga, 'dia', 'dias')}` : 'esperando o hospital'}
        active={situacao === 'aguardando_aceite'} onClick={() => onSituacao('aguardando_aceite')} />
      <KpiCard variant="success" label="Home care" value={contagens.homecare}
        meta={mediaHc != null ? `média de ${plural(mediaHc, 'dia', 'dias')} internado` : 'registrado no relatório'}
        active={situacao === 'homecare'} onClick={() => onSituacao('homecare')} />
    </div>
  )

  if (todos.length === 0) {
    return (
      <>
        {kpis}
        <div className="card" style={{ marginBottom: 16 }}>
          <Vazio
            titulo="Nenhum paciente em prorrogação, negociação ou home care neste recorte"
            texto="Eles aparecem aqui quando um relatório aprovado registra a prorrogação, a folha rosa ou o home care. Troque a operadora, o hospital ou o período para ver outros recortes."
          />
        </div>
      </>
    )
  }

  const topHosps = hosps.slice(0, 10)
  const aceites = [
    { key: 'sim', label: ACEITES_FOLHA_ROSA.sim, total: neg.aceite.sim },
    { key: 'nao', label: ACEITES_FOLHA_ROSA.nao, total: neg.aceite.nao },
    { key: 'aguardando', label: ACEITES_FOLHA_ROSA.aguardando, total: neg.aceite.aguardando, alerta: true },
    ...(neg.aceite.sem_resposta > 0 ? [{ key: 'sem', label: 'Sem resposta', total: neg.aceite.sem_resposta }] : []),
  ]
  const trocas = neg.trocas.slice(0, 6).map((t) => ({
    key: `${t.de}→${t.para}`, label: `${t.de} → ${t.para}`, total: t.pacientes,
    detalhe: t.diarias > 0 ? plural(t.diarias, 'diária', 'diárias') : undefined,
  }))

  return (
    <>
      {kpis}

      <div className="acomp-grid">
        <div className="chart-card">
          <div className="chart-title">Por hospital</div>
          <div className="chart-hint">
            {hosps.length > topHosps.length ? `Os ${topHosps.length} hospitais com mais casos · ` : ''}
            Um paciente pode contar em mais de uma situação · clique numa barra para filtrar
          </div>
          <div style={{ height: Math.max(200, topHosps.length * 34 + 72) }}>
            <SituacaoHospBar hosps={topHosps} onHosp={onHospital} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Quando as prorrogações terminam</div>
          <div className="chart-hint">
            {contagens.prorrogados > 0
              ? `${plural(contagens.prorrogados, 'prorrogação', 'prorrogações')} · contado a partir de ${m.dia_label}`
              : 'Prorrogação aprovada que ainda não terminou'}
          </div>
          {contagens.prorrogados > 0 ? (
            <div style={{ height: 260 }}><VencimentoBar dados={venc} /></div>
          ) : (
            <Vazio titulo="Nenhuma prorrogação em curso" texto="A prorrogação entra aqui quando o relatório que a pede é aprovado." />
          )}
        </div>
      </div>

      <div className="acomp-grid">
        <div className="chart-card">
          <div className="chart-title">Negociação (folha rosa)</div>
          <div className="chart-hint">
            {neg.total > 0
              ? `${plural(neg.total, 'negociação', 'negociações')} · ${plural(neg.diarias, 'diária negociada', 'diárias negociadas')}`
              : 'A negociação mais recente de cada paciente, num relatório aprovado'}
          </div>
          {neg.total > 0 ? (
            <>
              <div className="sub-chart-lbl acomp-sub">Aceite do hospital</div>
              <Medidores itens={aceites} base={neg.total} cor={COR_SITUACAO.negociacao} />
              <div className="sub-chart-lbl acomp-sub">Troca de acomodação</div>
              <Medidores itens={trocas} base={neg.total} cor={COR_SITUACAO.negociacao} />
            </>
          ) : (
            <Vazio titulo="Nenhuma negociação" texto="Entra aqui a folha rosa registrada num relatório aprovado." />
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">Home care: o que o paciente precisa</div>
          <div className="chart-hint">
            {hc.total > 0
              ? `${plural(hc.total, 'paciente', 'pacientes')} em home care · ${hc.comRespostas} com as respostas do relatório`
              : 'As respostas do home care no relatório aprovado mais recente'}
          </div>
          {hc.comRespostas > 0 ? (
            <Medidores itens={hc.itens} base={hc.comRespostas} cor={COR_SITUACAO.homecare} />
          ) : hc.total > 0 ? (
            <Vazio titulo="Sem respostas para mostrar"
              texto="Os pacientes em home care deste recorte vêm das altas antigas com o motivo Homecare, que não têm as respostas do relatório." />
          ) : (
            <Vazio titulo="Nenhum paciente em home care" texto="Entra aqui o home care registrado num relatório aprovado." />
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            Pacientes em acompanhamento
            {sit && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {sit.label}</span>}
            {' · '}<span>{lista.length}</span>
          </div>
          {sit && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSituacao('')}>Mostrar todos</button>
          )}
        </div>
        <TabelaPacientes pacientes={lista} onSelecionar={onSelecionar} onPrefetch={onPrefetch}
          vazio={sit ? 'Nenhum paciente com esta situação' : 'Nenhum paciente neste recorte'} />
      </div>
    </>
  )
}
