import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, apiDownload } from '../api/client'
import type { DashboardPayload, SidebarData } from '../types/api'
import Layout from '../components/Layout'
import { StatusBadge, rowFlagClass, LeitoTag } from '../components/StatusBadge'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import { LoadingState, Spinner } from '../components/ui'

const OP_INITIALS: Record<string, string> = {
  sulamerica: 'SU', bradesco: 'BR', careplus: 'CA', itau: 'IT',
  porto: 'PO', allianz: 'AL', mediservic: 'MS', notredame: 'ND',
}
function opInitial(key: string): string {
  return OP_INITIALS[key] || key.slice(0, 2).toUpperCase()
}

// Exibe uma contagem de dias como fração "valor / limite" (ex.: dias sem relatório
// sobre a janela, ou dias internado sobre o gatilho). O valor recebe cor de alerta
// via `tone`; o denominador fica discreto. Alinhado à direita, em fonte mono.
type Tone = 'danger' | 'warning' | 'neutral'
const TONE_COLOR: Record<Tone, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  neutral: 'var(--ink)',
}
// Marcador de longa permanência. Mostra o limite REAL que o paciente atingiu (em
// dias), configurado por operadora — não os rótulos fixos 10/30. "Avançada" tem
// precedência sobre "prolongada"; sem marcador → traço.
function Permanencia({ longa10, longa30, limiteLonga, limiteAvancada }: {
  longa10?: boolean
  longa30?: boolean
  limiteLonga?: number | null
  limiteAvancada?: number | null
}) {
  if (longa30) {
    return (
      <span className="mono fw-6 t-danger" title={`Permanência avançada: internado há ≥ ${limiteAvancada ?? '?'} dias`}>
        {limiteAvancada != null ? `${limiteAvancada}d+` : '—'}
      </span>
    )
  }
  if (longa10) {
    return (
      <span className="mono fw-6 t-warning" title={`Permanência prolongada: internado há ≥ ${limiteLonga ?? '?'} dias`}>
        {limiteLonga != null ? `${limiteLonga}d+` : '—'}
      </span>
    )
  }
  return <span style={{ color: 'var(--muted-2)' }}>—</span>
}

function DiasRatio({ value, limit, tone = 'neutral' }: {
  value: number | null | undefined
  limit: number | null | undefined
  tone?: Tone
}) {
  if (value == null) return <span style={{ color: 'var(--muted-2)' }}>—</span>
  const strong = tone !== 'neutral'
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 1,
        justifyContent: 'flex-end',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ fontSize: 'var(--t-md)', fontWeight: strong ? 700 : 600, color: TONE_COLOR[tone] }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: 'var(--muted-3)', fontWeight: 500 }}>d</span>
      {limit != null && (
        <span style={{ fontSize: 11, color: 'var(--muted-2)', marginLeft: 2 }}>/&thinsp;{limit}</span>
      )}
    </span>
  )
}

export default function Dashboard() {
  const [params, setParams] = useSearchParams()
  const operadora = params.get('operadora') || 'sulamerica'
  const filtro = params.get('filtro') || 'todos'
  const hospital = params.get('hospital') || ''

  // Filtros client-side
  const [busca, setBusca] = useState('')
  const [utiOn, setUtiOn] = useState(false)
  const [d30On, setD30On] = useState(false)
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function exportar() {
    try {
      await apiDownload(`/export-rvm?operadora=${operadora}`, `CONTROLE_AUDITORIA_${operadora}.xlsx`)
    } catch {
      setToast('Falha ao exportar')
    }
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', operadora, filtro, hospital],
    queryFn: () =>
      apiFetch<DashboardPayload>(
        `/dashboard?operadora=${encodeURIComponent(operadora)}&filtro=${encodeURIComponent(filtro)}` +
          (hospital ? `&hospital=${encodeURIComponent(hospital)}` : ''),
      ),
  })

  // Lista de operadoras para o seletor (reaproveita o cache do sidebar).
  const { data: sidebar } = useQuery({
    queryKey: ['sidebar'],
    queryFn: () => apiFetch<SidebarData>('/sidebar'),
    staleTime: 30_000,
  })
  const operadorasLista = sidebar?.operadoras ?? []

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  function applyFilter(f: string) {
    const next = new URLSearchParams(params)
    next.set('filtro', filtro === f ? 'todos' : f)
    next.delete('hospital')
    setParams(next)
  }

  const stats = data?.stats ?? {}
  const internacoes = data?.internacoes ?? []

  const visiveis = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return internacoes.filter((p) => {
      const nome = (p.nome || '').toLowerCase()
      const atend = String(p.atendimento || '').toLowerCase()
      const okBusca = !q || nome.includes(q) || atend.includes(q)
      const okUti = !utiOn || (p.tipo_leito || '').toUpperCase() === 'UTI'
      const ok30 = !d30On || Number(p.dias || 0) > 30
      return okBusca && okUti && ok30
    })
  }, [internacoes, busca, utiOn, d30On])

  const kpis: Array<[string, number, string, string, string]> = [
    ['sem_relatorio', Number(stats.sem_relatorio || 0), 'danger', 'Sem Relatório', 'nunca registrado'],
    ['vencido', Number(stats.relatorio_vencido || 0), 'warning', 'Atrasado', 'passou da janela'],
    ['proximo', Number(stats.proximo_vencer || 0), 'caution', 'Próx. Vencer', 'vence em 1–3 dias'],
    ['em_dia', Number(stats.relatorio_em_dia || 0), 'success', 'Em Dia', 'dentro da janela'],
    ['todos', Number(stats.total_internados || 0), 'neutral', 'Total Ativos', `${stats.em_monitoramento || 0} em monitoramento`],
  ]

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => refetch()} disabled={isFetching}>
        {isFetching && <Spinner size={13} />}
        {isFetching ? 'Atualizando…' : 'Atualizar'}
      </button>
      <button className="btn btn-primary btn-sm" onClick={exportar}>
        Exportar
      </button>
    </>
  )

  return (
    <Layout
      title="Painel Operacional"
      subtitle={data ? `${data.op_nome} · ${stats.total_internados || 0} internados · Ref: ${stats.hoje_efetivo || '—'}` : undefined}
      actions={actions}
    >
      {/* Seletor de operadora */}
      <div className="row" style={{ gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span className={`op-av ${operadora}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10 }}>
          {opInitial(operadora)}
        </span>
        <select
          className="bm-input bm-select"
          style={{ width: 'auto', minWidth: 220 }}
          value={operadora}
          onChange={(e) => setParam('operadora', e.target.value)}
        >
          {operadorasLista.length === 0 && <option value={operadora}>{data?.op_nome || operadora}</option>}
          {operadorasLista.map((op) => (
            <option key={op.key} value={op.key}>{op.nome}</option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingState label="Carregando painel…" />}
      {isError && <div className="empty-state t-danger">Erro ao carregar o painel.</div>}

      {data && (
        <>
          {/* KPIs */}
          <div className="section-label">Controle de Relatórios de Auditoria</div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            {kpis.map(([fkey, val, cls, lbl, meta]) => (
              <div
                key={fkey}
                className={`kpi ${cls} kpi-clickable${filtro === fkey ? ' active-filter' : ''}`}
                onClick={() => applyFilter(fkey)}
              >
                <div className="kpi-bar" />
                <div className="kpi-label">{lbl}</div>
                <div className="kpi-value">{val}</div>
                <div className="kpi-meta">{meta}</div>
              </div>
            ))}
          </div>

          {/* Seletor de hospital */}
          <div className="section-label" style={{ marginTop: 18 }}>
            Hospital — {data.hospitais.length} unidades cadastradas
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 280, maxWidth: 420, flex: 1 }}>
              <select
                className="bm-input bm-select"
                value={hospital}
                onChange={(e) => setParam('hospital', e.target.value || null)}
              >
                <option value="">Todos os hospitais ({stats.total_internados || 0} internados)</option>
                {data.hospitais.map((h) => (
                  <option key={h.key} value={h.key}>
                    {h.nome}
                    {h.internados ? ` — ${h.internados} internado${h.internados !== 1 ? 's' : ''}` : ''}
                    {h.urgente ? ` · ${h.urgente} alerta${h.urgente !== 1 ? 's' : ''}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {hospital && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)' }} onClick={() => setParam('hospital', null)}>
                Limpar filtro
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div className="quick-filters" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', flexShrink: 0 }}>Filtros rápidos:</span>
            <span className={`qf-chip${filtro === 'sem_relatorio' ? ' active' : ''}`} onClick={() => applyFilter('sem_relatorio')}>
              Sem relatório{filtro === 'sem_relatorio' && ' ×'}
            </span>
            <span className={`qf-chip${filtro === 'vencido' ? ' active' : ''}`} onClick={() => applyFilter('vencido')}>
              Vencidos{filtro === 'vencido' && ' ×'}
            </span>
            <span className={`qf-chip${utiOn ? ' active' : ''}`} onClick={() => setUtiOn((v) => !v)}>UTI / CTI</span>
            <span className={`qf-chip${d30On ? ' active' : ''}`} onClick={() => setD30On((v) => !v)}>&gt; 30 dias</span>
            <div style={{ flex: 1 }} />
            <input
              type="text"
              className="bm-input"
              style={{ width: 260 }}
              placeholder="Buscar segurado, atendimento…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {/* Tabela */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-header" style={{ alignItems: 'center', paddingBottom: 14 }}>
              <div>
                <div className="card-title">Todos os Internados</div>
                <div className="card-sub">
                  <span className="mono fw-6">{visiveis.length}</span> de{' '}
                  <span className="mono fw-6">{stats.total_internados || internacoes.length}</span>
                  <span className="dot-sep" />
                  Clique na linha para detalhes
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={exportar}>Exportar</button>
            </div>

            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              <table className="bmais-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Relatório</th>
                    <th>Hospital</th>
                    <th>Segurado</th>
                    <th style={{ width: 86 }}>Atend.</th>
                    <th style={{ width: 60 }}>Leito</th>
                    <th style={{ width: 96 }}>Internação</th>
                    <th>Última Visita</th>
                    <th style={{ width: 96 }} className="t-right" title="Dias desde o último relatório sobre a janela permitida (ex.: 5 / 7)">
                      Sem relatório
                    </th>
                    <th style={{ width: 88 }} className="t-right" title="Dias de internação sobre o gatilho de alerta (ex.: 12 / 10)">
                      Dias internado
                    </th>
                    <th style={{ width: 78 }} className="t-right" title="Marcador de longa permanência: 10 dias ou 30 dias">
                      Permanência
                    </th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((p) => {
                    const sr = p.status_relatorio || 'AGUARDANDO'
                    return (
                      <tr key={p.id} className={rowFlagClass(sr)} style={{ cursor: 'pointer' }} onClick={() => setDrawerId(p.id)}>
                        <td><StatusBadge sr={sr} /></td>
                        <td><span style={{ fontSize: 'var(--t-sm)' }}>{p.hospital_nome || '—'}</span></td>
                        <td style={{ maxWidth: 240 }}><div className="truncate fw-5">{p.nome}</div></td>
                        <td><span className="mono t-muted" style={{ fontSize: 'var(--t-sm)' }}>{p.atendimento || '—'}</span></td>
                        <td><LeitoTag tipo={p.tipo_leito} /></td>
                        <td><span className="mono" style={{ fontSize: 'var(--t-sm)' }}>{p.data_entrada || '—'}</span></td>
                        <td><span className="mono" style={{ fontSize: 'var(--t-sm)' }}>{p.data_ultima_visita || '—'}</span></td>
                        <td className="t-right">
                          <DiasRatio
                            value={p.dias_sem_relatorio}
                            limit={p.janela_relatorio}
                            tone={
                              sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL'
                                ? 'danger'
                                : sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO'
                                  ? 'warning'
                                  : 'neutral'
                            }
                          />
                        </td>
                        <td className="t-right">
                          <DiasRatio
                            value={p.dias}
                            limit={p.gatilho}
                            tone={p.longa_30 ? 'danger' : p.longa_10 ? 'warning' : 'neutral'}
                          />
                        </td>
                        <td className="t-right">
                          <Permanencia
                            longa10={p.longa_10}
                            longa30={p.longa_30}
                            limiteLonga={p.limite_longa}
                            limiteAvancada={p.limite_avancada}
                          />
                        </td>
                        <td onClick={(e) => { e.stopPropagation(); setDrawerId(p.id) }}>
                          <button className="btn btn-ghost btn-sm" title="Registrar relatório" style={{ padding: 5, color: 'var(--accent)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {visiveis.length === 0 && (
                    <tr>
                      <td colSpan={11}>
                        <div className="empty-state">
                          <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>📋</div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum internado encontrado</div>
                          <div style={{ fontSize: 'var(--t-sm)' }}>Tente outro filtro ou operadora.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
                Mostrando {visiveis.length} de {stats.total_internados || internacoes.length}
              </span>
            </div>
          </div>
        </>
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => {
            setDrawerId(null)
            setToast(msg)
            refetch()
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Layout>
  )
}
