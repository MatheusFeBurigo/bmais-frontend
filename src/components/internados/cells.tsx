// Células de apresentação da tabela de internados. São puras (sem estado) e
// reutilizáveis — extraídas de Dashboard.tsx para enxugar a página.

export type Tone = 'danger' | 'warning' | 'neutral'

const TONE_COLOR: Record<Tone, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  neutral: 'var(--ink)',
}

// Marcador de longa permanência. Mostra o limite REAL que o paciente atingiu (em
// dias), configurado por operadora — não os rótulos fixos 10/30. "Avançada" tem
// precedência sobre "prolongada"; sem marcador → traço.
export function Permanencia({ longa10, longa30, limiteLonga, limiteAvancada }: {
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

// Contagem de dias como fração "valor / limite" (ex.: dias sem relatório sobre a
// janela, ou dias internado sobre o gatilho). O valor recebe cor de alerta via
// `tone`; o denominador fica discreto. Alinhado à direita, em fonte mono.
export function DiasRatio({ value, limit, tone = 'neutral' }: {
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
