// Médias do período da JANELA selecionada (30d/90d/6m/1a). Mantém a MESMA
// estilização do MediasCards original (mesmo AvgCard, mesmas variantes de cor e
// layout de 3 cards) — só que a fonte agora é a média da janela do gráfico, com
// os títulos acompanhando o seletor (30 dias / 90 dias / 6 meses / 1 ano).
// Extraído de pages/Gestor.tsx.
import type { GestorMetrics } from '../../types/api'
import { AvgCard, avgCardStyles } from '../MediasCards'

export default function MediasJanelaCard({ media, janelaTitulo }: {
  media: GestorMetrics['media_janela']; janelaTitulo: string
}) {
  return (
    <>
      <style>{avgCardStyles}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <AvgCard titulo={`Média · ${janelaTitulo}`} variant="primary-kpi" items={[
          [media.internados_media, 'internados/dia'],
          [media.entradas_total, 'entradas no período'],
          [media.altas_total, 'altas no período'],
        ]} />
        <AvgCard titulo="Entradas" variant="info" items={[
          [media.entradas_total, `entradas (${janelaTitulo})`],
          [media.internados_media, 'internados/dia'],
        ]} />
        <AvgCard titulo="Altas" variant="caution" items={[
          [media.altas_total, `altas (${janelaTitulo})`],
          [media.altas_dia, 'altas/dia'],
        ]} />
      </div>
    </>
  )
}
