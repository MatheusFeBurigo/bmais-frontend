// Donut de status de relatórios + card de tendência semanal (lado a lado).
// Apresentação pura. Extraído de pages/Diretoria.tsx.
import type { DiretoriaPayload } from '../../types/api'
import { Badge } from '../ui'
import { DonutChart, LineChart } from '../charts'
import { DONUT_LABELS, DONUT_COLORS } from './diretoria.styles'

export default function StatusDonutCard({ data }: { data: DiretoriaPayload }) {
  const vals = [data.sem_relatorio, data.relatorio_vencido, data.proximo_vencer, data.relatorio_em_dia, data.aguardando_gatilho]
  return (
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
              data={vals.map((v) => v || 0)}
            />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {DONUT_LABELS.map((lbl, i) => (
              <div key={lbl} className="row" style={{ justifyContent: 'space-between' }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: DONUT_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--t-base)' }}>{lbl}</span>
                </div>
                <span className="mono fw-6" style={{ fontSize: 15 }}>{vals[i] || 0}</span>
              </div>
            ))}
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
  )
}
