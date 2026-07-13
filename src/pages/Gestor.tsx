import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ChartOptions } from 'chart.js'
import { apiFetch } from '../api/client'
import type { GestorMetrics, GestorResposta } from '../types/api'
import Layout from '../components/Layout'
import { KpiCard, Badge, OpAvatar, LoadingState } from '../components/ui'
import { Chart, Doughnut, Bar } from '../components/charts'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'

const GRID = '#EFF2F5'
const AXIS = '#8595A6'
const MONO = { family: 'Geist Mono', size: 10 }
const FAIXA_KEYS = ['0_9', '10_29', '30p'] as const

type FaixaFiltro = '' | '0_9' | '10_29' | '30p' | 'altas'

const localStyles = `
.gestor-filters{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:16px}
.gf-field label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:4px}
.avg-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 18px}
.avg-title{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:var(--muted);margin-bottom:10px}
.avg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.avg-item-val{font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.1}
.avg-item-label{font-size:var(--t-xs);color:var(--muted);margin-top:2px}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 18px}
.chart-title{font-size:var(--t-sm);font-weight:600;color:var(--ink);margin-bottom:2px}
.chart-hint{font-size:var(--t-xs);color:var(--muted-2);margin-bottom:12px}
.pill-faixa{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;font-size:var(--t-sm);font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);transition:all .12s}
.pill-faixa.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.tbl-gestor tbody tr{cursor:pointer}
.tbl-gestor tbody tr:hover td{background:var(--surface-3)}
.faixa-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
`

export default function Gestor() {
  const [params, setParams] = useSearchParams()
  const fData = params.get('data') || ''
  const fOperadora = params.get('operadora') || ''
  const fHospital = params.get('hospital') || ''
  const fRegiao = params.get('regiao') || ''

  const [faixa, setFaixa] = useState<FaixaFiltro>('')
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const qs = new URLSearchParams()
  if (fData) qs.set('data', fData)
  if (fOperadora) qs.set('operadora', fOperadora)
  if (fHospital) qs.set('hospital', fHospital)
  if (fRegiao) qs.set('regiao', fRegiao)

  // O backend devolve métricas e opções de filtro num único payload aninhado
  // ({ metrics, filtros }) — não há rota /gestor/filtros separada.
  const { data: payload, isLoading, isError } = useQuery({
    queryKey: ['gestor', fData, fOperadora, fHospital, fRegiao],
    queryFn: () => apiFetch<GestorResposta>(`/gestor?${qs.toString()}`),
  })
  const m = payload?.metrics
  const filtros = payload?.filtros

  // Atualiza um conjunto de query params de uma vez (equivale ao urlCom do template).
  function setFiltro(patch: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  function toggleFaixa(f: FaixaFiltro) {
    setFaixa((cur) => (cur === f ? '' : f))
  }

  const temFiltros = Boolean(fOperadora || fHospital || fRegiao)

  const visiveis = useMemo(() => {
    const lista = m?.pacientes_dia ?? []
    if (!faixa) return lista
    if (faixa === 'altas') return lista.filter((p) => p.situacao === 'ALTA')
    return lista.filter((p) => p.faixa === faixa && p.situacao === 'INTERNADO')
  }, [m, faixa])

  const actions = temFiltros ? (
    <button className="btn btn-outline btn-sm" onClick={() => setFiltro({ operadora: '', hospital: '', regiao: '' })}>
      Limpar filtros
    </button>
  ) : undefined

  const subtitle = m
    ? `Fluxo diário de internações · ${m.dia_label}${temFiltros ? ' · filtros ativos' : ''}`
    : undefined

  return (
    <Layout title="Painel do Gestor" subtitle={subtitle} actions={actions}>
      <style>{localStyles}</style>

      {/* Filtros */}
      <div className="gestor-filters">
        <div className="gf-field">
          <label>Dia</label>
          <input
            type="date"
            className="bm-input"
            value={m?.dia || fData}
            onChange={(e) => setFiltro({ data: e.target.value })}
          />
        </div>
        <div className="gf-field">
          <label>Operadora</label>
          <select className="bm-input bm-select" value={fOperadora} onChange={(e) => setFiltro({ operadora: e.target.value })}>
            <option value="">Todas</option>
            {filtros?.operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
          </select>
        </div>
        <div className="gf-field">
          <label>Hospital</label>
          <select className="bm-input bm-select" value={fHospital} onChange={(e) => setFiltro({ hospital: e.target.value })}>
            <option value="">Todos</option>
            {filtros?.hospitais.map((h) => <option key={h.key} value={h.key}>{h.nome}</option>)}
          </select>
        </div>
        {filtros && filtros.regioes.length > 0 && (
          <div className="gf-field">
            <label>Região / Estado</label>
            <select className="bm-input bm-select" value={fRegiao} onChange={(e) => setFiltro({ regiao: e.target.value })}>
              <option value="">Todas</option>
              {filtros.regioes.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </div>

      {isLoading && <LoadingState label="Carregando painel…" />}
      {isError && <div className="empty-state t-danger">Erro ao carregar o painel.</div>}

      {m && (
        <>
          {/* KPIs do dia (clicáveis → filtram a lista) */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
            <KpiCard variant="primary-kpi" label="Internados no Dia" value={m.hoje.internados}
              meta={`total ativo em ${m.dia_label}`} active={faixa === ''} onClick={() => toggleFaixa('')} />
            <KpiCard variant="info" label="Até 9 dias" value={m.hoje.f0_9}
              meta="permanência curta" active={faixa === '0_9'} onClick={() => toggleFaixa('0_9')} />
            <KpiCard variant="warning" label="10 a 29 dias" value={m.hoje.f10_29}
              meta="permanência prolongada" active={faixa === '10_29'} onClick={() => toggleFaixa('10_29')} />
            <KpiCard variant="danger" label="30+ dias" value={m.hoje.f30}
              meta="permanência crítica" active={faixa === '30p'} onClick={() => toggleFaixa('30p')} />
            <KpiCard variant="success" label="Altas do Dia" value={m.hoje.altas}
              meta={`${m.hoje.entradas} novas entradas`} active={faixa === 'altas'} onClick={() => toggleFaixa('altas')} />
          </div>

          {/* Médias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            <AvgCard titulo="Média do Mês" items={[
              [m.media_mes.internados_media, 'internados/dia'],
              [m.media_mes.altas_total, 'altas no mês'],
              [m.media_mes.entradas_total, 'entradas no mês'],
            ]} />
            <AvgCard titulo="Média Semestral" items={[
              [m.media_semestre.internados_media, 'internados/dia'],
              [m.media_semestre.altas_total, 'altas (6 meses)'],
              [m.media_semestre.altas_dia, 'altas/dia'],
            ]} />
            <AvgCard titulo="Média Anual" items={[
              [m.media_ano.internados_media, 'internados/dia'],
              [m.media_ano.altas_total, 'altas (12 meses)'],
              [m.media_ano.altas_dia, 'altas/dia'],
            ]} />
          </div>

          {/* Fluxo 30 dias — clique muda o dia */}
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-title">Fluxo dos últimos 30 dias</div>
            <div className="chart-hint">Clique em um dia no gráfico para ver as métricas daquele dia</div>
            <div style={{ height: 240 }}>
              <FluxoChart m={m} onDia={(dia) => setFiltro({ data: dia })} />
            </div>
          </div>

          {/* Donut faixas + barras operadora */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, marginBottom: 16 }}>
            <div className="chart-card">
              <div className="chart-title">Permanência no dia</div>
              <div className="chart-hint">Clique numa faixa para filtrar a lista de pacientes</div>
              <div style={{ height: 220 }}>
                <FaixasDonut m={m} onFaixa={(f) => toggleFaixa(f)} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">Internados por operadora</div>
              <div className="chart-hint">Clique numa barra para filtrar o painel pela operadora</div>
              <div style={{ height: 220 }}>
                <OpsBar m={m} onOp={(key) => setFiltro({ operadora: key, hospital: '' })} />
              </div>
            </div>
          </div>

          {/* Hospitais + regiões */}
          <div style={{ display: 'grid', gridTemplateColumns: m.por_regiao.length > 1 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
            <div className="chart-card">
              <div className="chart-title">Internados por hospital (top 12)</div>
              <div className="chart-hint">Clique numa barra para filtrar o painel pelo hospital</div>
              <div style={{ height: 300 }}>
                <HospBar m={m} onHosp={(key) => setFiltro({ hospital: key })} />
              </div>
            </div>
            {m.por_regiao.length > 1 && (
              <div className="chart-card">
                <div className="chart-title">Internados por região</div>
                <div className="chart-hint">Clique numa barra para filtrar o painel pela região</div>
                <div style={{ height: 300 }}>
                  <RegBar m={m} onReg={(nome) => setFiltro({ regiao: nome })} />
                </div>
              </div>
            )}
          </div>

          {/* Lista de pacientes do dia */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pacientes do dia · <span>{visiveis.length}</span></div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`pill-faixa${faixa === '' ? ' active' : ''}`} onClick={() => toggleFaixa('')}>Todos</span>
                <span className={`pill-faixa${faixa === '0_9' ? ' active' : ''}`} onClick={() => toggleFaixa('0_9')}><span className="faixa-dot" style={{ background: '#1F5DAA' }} />Até 9d</span>
                <span className={`pill-faixa${faixa === '10_29' ? ' active' : ''}`} onClick={() => toggleFaixa('10_29')}><span className="faixa-dot" style={{ background: '#D9690C' }} />10–29d</span>
                <span className={`pill-faixa${faixa === '30p' ? ' active' : ''}`} onClick={() => toggleFaixa('30p')}><span className="faixa-dot" style={{ background: '#C8243C' }} />30+d</span>
                <span className={`pill-faixa${faixa === 'altas' ? ' active' : ''}`} onClick={() => toggleFaixa('altas')}><span className="faixa-dot" style={{ background: '#0E7A53' }} />Altas</span>
              </div>
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <table className="bmais-table tbl-gestor">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Hospital</th>
                    <th>Operadora</th>
                    <th>Entrada</th>
                    <th className="t-right">Dias</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((p) => (
                    <tr key={p.id} onClick={() => setDrawerId(p.id)}>
                      <td>
                        <div className="fw-6 truncate" style={{ maxWidth: 220 }}>{p.nome}</div>
                        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }} className="mono">{p.atendimento}</div>
                      </td>
                      <td className="truncate" style={{ maxWidth: 200, fontSize: 'var(--t-sm)' }}>{p.hospital_nome}</td>
                      <td><OpAvatar opKey={p.operadora_key} size={22} /></td>
                      <td className="mono" style={{ fontSize: 'var(--t-sm)' }}>{p.data_entrada}</td>
                      <td className="t-right mono fw-6" style={{ color: p.faixa === '30p' ? 'var(--danger)' : p.faixa === '10_29' ? '#D9690C' : undefined }}>{p.dias}</td>
                      <td>
                        {p.situacao === 'ALTA'
                          ? <Badge variant="success" dot>Alta</Badge>
                          : <Badge variant="info" dot>Internado</Badge>}
                      </td>
                    </tr>
                  ))}
                  {visiveis.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state" style={{ padding: '32px 16px' }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum paciente neste dia</div>
                          <div style={{ fontSize: 'var(--t-sm)' }}>Ajuste os filtros ou escolha outra data.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => { setDrawerId(null); setToast(msg) }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Layout>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function AvgCard({ titulo, items }: { titulo: string; items: Array<[number, string]> }) {
  return (
    <div className="avg-card">
      <div className="avg-title">{titulo}</div>
      <div className="avg-grid">
        {items.map(([val, lbl]) => (
          <div key={lbl}>
            <div className="avg-item-val">{val}</div>
            <div className="avg-item-label">{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function pointerCursor(evt: { native: Event | null }, els: unknown[]) {
  const target = evt.native?.target as HTMLElement | undefined
  if (target) target.style.cursor = els.length ? 'pointer' : 'default'
}

// 1. Fluxo 30 dias (linha internados + barras entradas/altas), eixos duplos
function FluxoChart({ m, onDia }: { m: GestorMetrics; onDia: (dia: string) => void }) {
  const serie = m.serie_30d
  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (evt, _els, chart) => {
      const pts = chart.getElementsAtEventForMode(evt as unknown as Event, 'index', { intersect: false }, true)
      if (pts.length) onDia(serie[pts[0].index].dia)
    },
    onHover: pointerCursor,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 14 } } },
    scales: {
      y: { beginAtZero: true, grid: { color: GRID }, ticks: { font: MONO, color: AXIS }, title: { display: true, text: 'Internados', font: { size: 10 } } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: MONO, color: AXIS }, title: { display: true, text: 'Entradas / Altas', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: MONO, color: AXIS, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
    },
  }
  return (
    <Chart
      type="bar"
      options={options}
      data={{
        labels: serie.map((s) => s.label),
        datasets: [
          { type: 'line' as const, label: 'Internados', data: serie.map((s) => s.internados), borderColor: '#155CA8', backgroundColor: 'rgba(21,92,168,.10)', fill: true, tension: 0.35, pointRadius: 2.5, pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: '#155CA8', pointBorderWidth: 2, yAxisID: 'y' },
          { type: 'bar' as const, label: 'Entradas', data: serie.map((s) => s.entradas), backgroundColor: 'rgba(14,122,83,.55)', borderRadius: 2, yAxisID: 'y1', barPercentage: 0.5 },
          { type: 'bar' as const, label: 'Altas', data: serie.map((s) => s.altas), backgroundColor: 'rgba(217,105,12,.55)', borderRadius: 2, yAxisID: 'y1', barPercentage: 0.5 },
        ],
      }}
    />
  )
}

// 2. Donut faixas — clique filtra a tabela
function FaixasDonut({ m, onFaixa }: { m: GestorMetrics; onFaixa: (f: '0_9' | '10_29' | '30p') => void }) {
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    onClick: (_evt, els) => { if (els.length) onFaixa(FAIXA_KEYS[els[0].index]) },
    onHover: pointerCursor,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 12 } } },
  }
  return (
    <Doughnut
      options={options}
      data={{
        labels: ['Até 9 dias', '10–29 dias', '30+ dias'],
        datasets: [{ data: [m.hoje.f0_9, m.hoje.f10_29, m.hoje.f30], backgroundColor: ['#1F5DAA', '#D9690C', '#C8243C'], borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
      }}
    />
  )
}

// 3. Barras por operadora — clique filtra por operadora
function OpsBar({ m, onOp }: { m: GestorMetrics; onOp: (key: string) => void }) {
  const ops = m.por_operadora
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_evt, els) => { if (els.length) onOp(ops[els[0].index].key) },
    onHover: pointerCursor,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 12 } } },
    scales: {
      y: { beginAtZero: true, grid: { color: GRID }, ticks: { font: MONO, color: AXIS } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: AXIS } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: ops.map((o) => o.nome),
        datasets: [
          { label: 'Internados', data: ops.map((o) => o.internados), backgroundColor: '#155CA8', borderRadius: 3 },
          { label: 'Altas no dia', data: ops.map((o) => o.altas), backgroundColor: '#0E7A53', borderRadius: 3 },
        ],
      }}
    />
  )
}

// 4. Barras horizontais por hospital (top 12) — clique filtra por hospital
function HospBar({ m, onHosp }: { m: GestorMetrics; onHosp: (key: string) => void }) {
  const hosps = m.por_hospital.slice(0, 12)
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_evt, els) => { if (els.length) onHosp(hosps[els[0].index].key) },
    onHover: pointerCursor,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, ticks: { font: MONO, color: AXIS } },
      y: { grid: { display: false }, ticks: { font: { size: 10 }, color: AXIS } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: hosps.map((h) => (h.nome.length > 28 ? h.nome.slice(0, 27) + '…' : h.nome)),
        datasets: [{ label: 'Internados', data: hosps.map((h) => h.internados), backgroundColor: '#155CA8', borderRadius: 3 }],
      }}
    />
  )
}

// 5. Barras por região — clique filtra por região (ignora "Sem região")
function RegBar({ m, onReg }: { m: GestorMetrics; onReg: (nome: string) => void }) {
  const regs = m.por_regiao
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_evt, els) => {
      if (els.length && regs[els[0].index].nome !== 'Sem região') onReg(regs[els[0].index].nome)
    },
    onHover: pointerCursor,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, ticks: { font: MONO, color: AXIS } },
      y: { grid: { display: false }, ticks: { font: { size: 10 }, color: AXIS } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: regs.map((r) => r.nome),
        datasets: [{ label: 'Internados', data: regs.map((r) => r.internados), backgroundColor: '#7B1FA2', borderRadius: 3 }],
      }}
    />
  )
}
