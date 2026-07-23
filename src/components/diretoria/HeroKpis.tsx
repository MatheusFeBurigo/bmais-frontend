// Linha de KPIs do topo da Diretoria (SLA, alertas, ativos, relatórios).
// Apresentação pura. Extraído de pages/Diretoria.tsx.
import type { DiretoriaPayload } from '../../types/api'
import { KpiCard, Badge, ProgressBar } from '../ui'

export default function HeroKpis({ data }: { data: DiretoriaPayload }) {
  const sla = data.sla_global || 0
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
      <KpiCard
        variant={sla < 50 ? 'danger' : 'success'}
        label="SLA Global"
        value={<>{sla}<span style={{ fontSize: 22, fontWeight: 500, color: 'var(--muted)' }}>%</span></>}
        meta={
          <>
            relatórios em dia / em monitoramento
            <div style={{ marginTop: 10 }}>
              <ProgressBar pct={sla} color={sla < 50 ? 'var(--danger)' : 'var(--success)'} />
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
  )
}
