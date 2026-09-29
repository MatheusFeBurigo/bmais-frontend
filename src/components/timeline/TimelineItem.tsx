// Um evento da timeline da internação. Componente único da ficha do paciente e
// do drawer: a regra do que cada evento mostra está em `apresentacaoDoEvento`
// (lib/timeline), e aqui só se desenha.
import { AutorChip, MedicoChip, roleVisual } from '../StatusBadge'
import { dataBR } from '../../lib/datas'
import { apresentacaoDoEvento } from '../../lib/timeline'
import type { TimelineEvento } from '../../types/api'

export function TimelineItem({ ev }: { ev: TimelineEvento }) {
  const { relatorio, cancelada, cardClass, dotClass, hora, chip } = apresentacaoDoEvento(ev)
  // Relatório: marcador na cor do papel de quem registrou, a mesma do chip.
  const dotStyle = relatorio ? { background: roleVisual(ev.autor_role).color } : undefined
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  const classes = ['tl-item', cardClass, cancelada ? 'tl-cancelada' : ''].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {/* Cancelada troca o marcador redondo por um X: o card já muda de cor
          (cinza), mas o X deixa o estado "não vai mais acontecer" legível sem
          depender só da cor. */}
      {cancelada ? (
        <span className="tl-dot-x" aria-hidden>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </span>
      ) : (
        <div className={`tl-dot ${dotClass}`} style={dotStyle} />
      )}
      <div className="tl-date">
        {ev.hoje ? 'Hoje' : dataBR(ev.data) || '—'}
        {hora && <span className="tl-hora"> às {hora}</span>}
      </div>
      <div className="tl-label" style={labelStyle}>
        <span className={cancelada ? 'tl-label-riscado' : undefined}>{ev.titulo}</span>
        {chip && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            {chip.tipo === 'medico'
              ? <MedicoChip nome={chip.nome} role={ev.autor_role} titulo={chip.titulo} />
              : <AutorChip role={ev.autor_role} autor={chip.autor} />}
          </span>
        )}
      </div>
      {ev.descricao && <div className="tl-desc">{ev.descricao}</div>}
    </div>
  )
}
