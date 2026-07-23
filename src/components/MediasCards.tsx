// Cards de Médias de fluxo (Mês / Semestral / Anual). Globais (mesmas para
// qualquer operadora). Mesmo conceito visual dos KPIs: barra lateral + degradê +
// título colorido por variante. Exibidos na Visão Geral.

import type { DashboardMedias } from '../types/api'

const styles = `
.avg-card{position:relative;overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px 14px 18px}
.avg-bar{position:absolute;left:0;top:0;bottom:0;width:3px}
.avg-title{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:var(--muted);margin-bottom:10px}
.avg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.avg-item-val{font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.1}
.avg-item-label{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.avg-card.info{background:linear-gradient(180deg,var(--info-bg),var(--surface) 68%)}
.avg-card.info .avg-bar{background:var(--info)}.avg-card.info .avg-title{color:var(--info)}
.avg-card.primary-kpi{background:linear-gradient(180deg,var(--primary-soft),var(--surface) 68%)}
.avg-card.primary-kpi .avg-bar{background:var(--primary)}.avg-card.primary-kpi .avg-title{color:var(--primary)}
.avg-card.caution{background:linear-gradient(180deg,var(--caution-bg),var(--surface) 68%)}
.avg-card.caution .avg-bar{background:var(--caution)}.avg-card.caution .avg-title{color:var(--caution)}
`

// Estilos dos cards de média — exportados para telas que montam o próprio
// conjunto de AvgCards (ex.: Gestor, com médias por janela) mantendo o visual.
export const avgCardStyles = styles

export function AvgCard({ titulo, items, variant }: {
  titulo: string
  items: Array<[number, string]>
  variant: 'primary-kpi' | 'info' | 'caution'
}) {
  return (
    <div className={`avg-card ${variant}`}>
      <div className="avg-bar" />
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

export default function MediasCards({ medias }: { medias: DashboardMedias }) {
  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <AvgCard titulo="Média do Mês" variant="primary-kpi" items={[
          [medias.media_mes.internados_media, 'internados/dia'],
          [medias.media_mes.altas_total, 'altas no mês'],
          [medias.media_mes.entradas_total, 'entradas no mês'],
        ]} />
        <AvgCard titulo="Média Semestral" variant="info" items={[
          [medias.media_semestre.internados_media, 'internados/dia'],
          [medias.media_semestre.altas_total, 'altas (6 meses)'],
          [medias.media_semestre.altas_dia, 'altas/dia'],
        ]} />
        <AvgCard titulo="Média Anual" variant="caution" items={[
          [medias.media_ano.internados_media, 'internados/dia'],
          [medias.media_ano.altas_total, 'altas (12 meses)'],
          [medias.media_ano.altas_dia, 'altas/dia'],
        ]} />
      </div>
    </>
  )
}
