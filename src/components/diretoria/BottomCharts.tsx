// Linha inferior da Diretoria: alertas por operadora + top hospitais + cards de
// inteligência (insights derivados). Apresentação pura. Extraído de pages/Diretoria.tsx.
import type { DiretoriaPayload } from '../../types/api'
import { BarChart } from '../charts'
import { HBAR_PALETTE, INTEL_COLORS } from './diretoria.styles'
import { derivarInsights } from './insights'

export default function BottomCharts({ data }: { data: DiretoriaPayload }) {
  const ops = data.por_operadora || []
  const topHosp = (data.top_hospitais || []).slice(0, 8)
  return (
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
              labels={ops.map((o) => (o.nome ? o.nome.split(' ')[0] : o.key))}
              legend
              datasets={[
                { label: 'Sem Relatório', color: '#C8243C', data: ops.map((o) => o.sem_relatorio || 0) },
                { label: 'Vencido', color: '#D9690C', data: ops.map((o) => o.relatorio_vencido || 0) },
                { label: 'Em Dia', color: '#0E7A53', data: ops.map((o) => o.relatorio_em_dia || 0) },
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
              labels={topHosp.map((h) => h.hospital_nome)}
              datasets={[{
                label: 'Internados',
                color: HBAR_PALETTE[0],
                data: topHosp.map((h) => h.internados || 0),
              }]}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Inteligência de Dados</div>
            <p className="card-sub">Insights derivados dos indicadores atuais</p>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          {derivarInsights(data).map((it) => {
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
  )
}
