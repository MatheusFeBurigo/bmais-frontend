import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, apiDownload } from '../api/client'
import type { DiretoriaPayload } from '../types/api'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { KpiCard, Badge, OpAvatar, ProgressBar } from '../components/ui'
import { DonutChart, LineChart, BarChart } from '../components/charts'

const DONUT_LABELS = ['Sem Rel.', 'Vencido', 'Próx. Vencer', 'Em Dia', 'Aguardando']
const DONUT_COLORS = ['#C8243C', '#D9690C', '#B58606', '#0E7A53', '#1F5DAA']
const HBAR_PALETTE = ['#062E5C', '#0A3E78', '#155CA8', '#1F6FBE', '#3F89D0', '#5FA0DC', '#7FB1E0', '#A9CCEC']

const INTEL: Array<{ clr: 'info' | 'warning' | 'primary' | 'muted'; title: string; desc: string; status: string }> = [
  { clr: 'info', title: 'Previsão de vencimentos', desc: 'Alertas preditivos para os próximos 7 dias', status: 'Em beta' },
  { clr: 'warning', title: 'Taxa de cobertura por auditor', desc: 'Produtividade por médico auditor', status: 'Disponível' },
  { clr: 'primary', title: 'Tendências de internação', desc: 'Análise de sazonalidade por hospital', status: 'Em beta' },
  { clr: 'muted', title: 'IA preditiva de alta', desc: 'Previsão de permanência baseada em histórico', status: 'Em breve' },
]
const INTEL_COLORS: Record<string, [string, string]> = {
  info: ['var(--info-bg)', 'var(--info)'],
  warning: ['var(--warning-bg)', 'var(--warning)'],
  primary: ['var(--primary-soft)', 'var(--primary)'],
  muted: ['var(--surface-3)', 'var(--muted)'],
}

export default function Diretoria() {
  const [toast, setToast] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['diretoria'],
    queryFn: () => apiFetch<DiretoriaPayload>('/diretoria'),
  })

  async function exportar() {
    try {
      await apiDownload('/export-rvm', 'CONTROLE_AUDITORIA.xlsx')
    } catch {
      setToast('Falha ao exportar')
    }
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      const d = await apiFetch<{ ok?: boolean; pacientes_inseridos?: number; relatorios_adicionados?: number }>(
        '/seed-demo', { method: 'POST' },
      )
      if (d.ok) {
        setToast(`✓ Demo inserido — ${d.pacientes_inseridos} pacientes, ${d.relatorios_adicionados} relatórios`)
        refetch()
      } else {
        setToast('Erro ao inserir demo')
      }
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSeeding(false)
    }
  }

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={seedDemo} disabled={seeding} title="Inserir dados demo">
        {seeding ? 'Inserindo…' : 'Seed Demo'}
      </button>
      <button className="btn btn-outline btn-sm" onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Atualizando…' : 'Atualizar'}
      </button>
    </>
  )

  const subtitle = data ? `KPIs consolidados de todas as operadoras · Ref: ${data.hoje_efetivo || '—'}` : undefined

  return (
    <Layout title="Dashboard da Diretoria" subtitle={subtitle} actions={actions}>
      {isLoading && <div className="empty-state">Carregando KPIs…</div>}
      {isError && <div className="empty-state t-danger">Erro ao carregar o dashboard.</div>}

      {data && (
        <>
          {/* Hero KPI row */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <KpiCard
              variant={(data.sla_global || 0) < 50 ? 'danger' : 'success'}
              label="SLA Global"
              value={<>{data.sla_global || 0}<span style={{ fontSize: 22, fontWeight: 500, color: 'var(--muted)' }}>%</span></>}
              meta={
                <>
                  relatórios em dia / em monitoramento
                  <div style={{ marginTop: 10 }}>
                    <ProgressBar pct={data.sla_global || 0} color={(data.sla_global || 0) < 50 ? 'var(--danger)' : 'var(--success)'} />
                  </div>
                </>
              }
            />
            <KpiCard
              variant="danger"
              label="Alertas Críticos"
              value={data.total_alertas || 0}
              meta={
                <>
                  sem relatório + vencidos (todas operadoras)
                  <div className="row" style={{ marginTop: 10, gap: 6 }}>
                    <Badge variant="danger" dot>{data.sem_relatorio || 0} s/rel.</Badge>
                    <Badge variant="warning" dot>{data.relatorio_vencido || 0} venc.</Badge>
                  </div>
                </>
              }
            />
            <KpiCard
              variant="info"
              label="Pacientes Ativos"
              value={data.total_internados || 0}
              meta={
                <div className="row" style={{ gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <span><span className="mono fw-6 t-ink-2">{data.longa_permanencia || 0}</span> longa</span>
                  <span>·</span>
                  <span><span className="mono fw-6 t-ink-2">{data.longa_avancada || 0}</span> avançada</span>
                  <span>·</span>
                  <span><span className="mono fw-6 t-ink-2">{data.total_altas || 0}</span> altas</span>
                </div>
              }
            />
            <KpiCard
              variant="primary-kpi"
              label="Relatórios Registrados"
              value={data.relatorios_7d || 0}
              meta={
                <div className="row" style={{ gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <span><span className="mono fw-6 t-ink-2">{data.relatorios_30d || 0}</span> últimos 30d</span>
                  <span>·</span>
                  <span><span className="mono fw-6 t-ink-2">{data.total_relatorios || 0}</span> total</span>
                </div>
              }
            />
          </div>

          {/* Donut + Tendência */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10, marginTop: 10 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Status de Relatórios — Visão Global</div>
                  <p className="card-sub">Distribuição dos {data.em_monitoramento || 0} pacientes em monitoramento</p>
                </div>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
                <div style={{ width: 200, height: 200 }}>
                  <DonutChart
                    labels={DONUT_LABELS}
                    colors={DONUT_COLORS}
                    data={[
                      data.sem_relatorio || 0, data.relatorio_vencido || 0,
                      data.proximo_vencer || 0, data.relatorio_em_dia || 0, data.aguardando_gatilho || 0,
                    ]}
                  />
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {DONUT_LABELS.map((lbl, i) => {
                    const vals = [data.sem_relatorio, data.relatorio_vencido, data.proximo_vencer, data.relatorio_em_dia, data.aguardando_gatilho]
                    return (
                      <div key={lbl} className="row" style={{ justifyContent: 'space-between' }}>
                        <div className="row" style={{ gap: 10 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: DONUT_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: 'var(--t-base)' }}>{lbl}</span>
                        </div>
                        <span className="mono fw-6" style={{ fontSize: 15 }}>{vals[i] || 0}</span>
                      </div>
                    )
                  })}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="row" style={{ gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--t-base)' }}>Altas (total)</span>
                      </div>
                      <span className="mono fw-6" style={{ fontSize: 15 }}>{data.total_altas || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Relatórios Registrados por Semana</div>
                  <p className="card-sub">Últimas 8 semanas — tendência de cobertura</p>
                </div>
                <Badge variant="info">Total: {data.total_relatorios || 0}</Badge>
              </div>
              <div className="card-body" style={{ paddingBottom: 14 }}>
                <div style={{ height: 200 }}>
                  <LineChart labels={data.trend_labels} data={data.trend_semanal} />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo por Operadora */}
          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Resumo por Operadora</div>
                <p className="card-sub">Dados consolidados para todas as operadoras ativas</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={exportar}>Exportar</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="bmais-table">
                <thead>
                  <tr>
                    <th>Operadora</th>
                    <th className="t-right">Internados</th>
                    <th className="t-right">Em Mon.</th>
                    <th className="t-right" style={{ color: 'var(--danger)' }}>Sem Rel.</th>
                    <th className="t-right" style={{ color: 'var(--warning)' }}>Vencido</th>
                    <th className="t-right" style={{ color: 'var(--caution)' }}>Próx.</th>
                    <th className="t-right" style={{ color: 'var(--success)' }}>Em Dia</th>
                    <th style={{ minWidth: 140 }}>SLA</th>
                    <th className="t-right">L.10</th>
                    <th className="t-right">L.30</th>
                    <th className="t-right">Altas</th>
                    <th>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.por_operadora || []).map((op) => {
                    const sla = op.sla || 0
                    const low = sla < 50
                    return (
                      <tr key={op.key}>
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <OpAvatar opKey={op.key} size={28} />
                            <div>
                              <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>{op.nome}</div>
                              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>janela: {op.janela_relatorio || '—'}d</div>
                            </div>
                          </div>
                        </td>
                        <td className="t-right mono fw-6">{op.internados || 0}</td>
                        <td className="t-right mono t-muted">{op.em_monitoramento || 0}</td>
                        <td className={`t-right mono ${(op.sem_relatorio || 0) > 0 ? 't-danger fw-6' : 't-muted'}`}>{(op.sem_relatorio || 0) > 0 ? op.sem_relatorio : '—'}</td>
                        <td className={`t-right mono ${(op.relatorio_vencido || 0) > 0 ? 't-warning fw-6' : 't-muted'}`}>{(op.relatorio_vencido || 0) > 0 ? op.relatorio_vencido : '—'}</td>
                        <td className="t-right mono t-muted">{op.proximo_vencer || '—'}</td>
                        <td className={`t-right mono ${(op.relatorio_em_dia || 0) > 0 ? 't-success fw-6' : 't-muted'}`}>{(op.relatorio_em_dia || 0) > 0 ? op.relatorio_em_dia : '—'}</td>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar pct={sla} color={low ? 'var(--danger)' : 'var(--success)'} />
                            </div>
                            <span className="mono fw-6" style={{ fontSize: 12, color: low ? 'var(--danger)' : 'var(--success)' }}>{sla}%</span>
                          </div>
                        </td>
                        <td className="t-right mono">{op.longa_permanencia || '—'}</td>
                        <td className="t-right mono">{op.longa_avancada || '—'}</td>
                        <td className="t-right mono">
                          {op.total_altas || 0}
                          {(op.total_altas || 0) > 0 && <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 3 }}>({op.total_altas}↑)</span>}
                        </td>
                        <td style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{op.responsaveis || '—'}</td>
                      </tr>
                    )
                  })}
                  {/* Total geral */}
                  <tr style={{ background: 'var(--surface-3)' }}>
                    <td><strong style={{ letterSpacing: '.08em', fontSize: 11, textTransform: 'uppercase' }}>Total geral</strong></td>
                    <td className="t-right mono fw-7">{data.total_internados || 0}</td>
                    <td className="t-right mono fw-6">{data.em_monitoramento || 0}</td>
                    <td className="t-right mono fw-7 t-danger">{data.sem_relatorio || 0}</td>
                    <td className="t-right mono fw-6 t-warning">{data.relatorio_vencido || 0}</td>
                    <td className="t-right mono">{data.proximo_vencer || '—'}</td>
                    <td className="t-right mono fw-6 t-success">{data.relatorio_em_dia || 0}</td>
                    <td className={`mono fw-6 ${(data.sla_global || 0) < 50 ? 't-danger' : 't-success'}`}>{data.sla_global || 0}%</td>
                    <td className="t-right mono">{data.longa_permanencia || 0}</td>
                    <td className="t-right mono">{data.longa_avancada || 0}</td>
                    <td className="t-right mono">{data.total_altas || 0}</td>
                    <td style={{ color: 'var(--muted)' }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom row: bar charts + intel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 10, marginTop: 10 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Alertas por Operadora</div>
                  <p className="card-sub">Pacientes sem relatório + vencidos</p>
                </div>
              </div>
              <div className="card-body" style={{ paddingBottom: 14 }}>
                <div style={{ height: 260 }}>
                  <BarChart
                    labels={(data.por_operadora || []).map((o) => (o.nome ? o.nome.split(' ')[0] : o.key))}
                    legend
                    datasets={[
                      { label: 'Sem Relatório', color: '#C8243C', data: (data.por_operadora || []).map((o) => o.sem_relatorio || 0) },
                      { label: 'Vencido', color: '#D9690C', data: (data.por_operadora || []).map((o) => o.relatorio_vencido || 0) },
                      { label: 'Em Dia', color: '#0E7A53', data: (data.por_operadora || []).map((o) => o.relatorio_em_dia || 0) },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Top Hospitais — Internados Ativos</div>
                  <p className="card-sub">Concentração de pacientes por unidade</p>
                </div>
              </div>
              <div className="card-body" style={{ paddingBottom: 14 }}>
                <div style={{ height: 260 }}>
                  <BarChart
                    horizontal
                    labels={(data.top_hospitais || []).slice(0, 8).map((h) => h.hospital_nome)}
                    datasets={[{
                      label: 'Internados',
                      color: HBAR_PALETTE[0],
                      data: (data.top_hospitais || []).slice(0, 8).map((h) => h.internados || 0),
                    }]}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Inteligência de Dados</div>
                  <p className="card-sub">Funcionalidades em desenvolvimento</p>
                </div>
              </div>
              <div className="card-body" style={{ display: 'grid', gap: 10 }}>
                {INTEL.map((it) => {
                  const [bg, fg] = INTEL_COLORS[it.clr]
                  return (
                    <div key={it.title} className="intel-card" style={{ background: bg, borderLeft: `3px solid ${fg}` }}>
                      <div className="row" style={{ gap: 10 }}>
                        <span style={{ fontWeight: 600, color: fg, fontSize: 'var(--t-base)', flex: 1 }}>{it.title}</span>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, opacity: 0.7, color: fg }}>{it.status}</span>
                      </div>
                      <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 4 }}>{it.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Layout>
  )
}
