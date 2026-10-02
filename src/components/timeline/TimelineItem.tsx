// Um evento da timeline da internação. Componente único da ficha do paciente e
// do drawer: a regra do que cada evento mostra está em `apresentacaoDoEvento`
// (lib/timeline), e aqui só se desenha.
import { Link } from 'react-router-dom'
import { AutorChip, MedicoChip, roleVisual } from '../StatusBadge'
import { dataBR } from '../../lib/datas'
import { apresentacaoDoEvento } from '../../lib/timeline'
import type { TimelineEvento } from '../../types/api'

export function TimelineItem({ ev, onDesvincular }: {
  ev: TimelineEvento
  /** Presente só na ficha, para quem pode: o "Não é este paciente" na admissão
   *  de outra internação ligada a esta pessoa. */
  onDesvincular?: (internacaoId: number) => void
}) {
  const { relatorio, cancelada, cardClass, dotClass, hora, chip } = apresentacaoDoEvento(ev)
  // Relatório: marcador na cor do papel de quem registrou, a mesma do chip.
  const dotStyle = relatorio ? { background: roleVisual(ev.autor_role).color } : undefined
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  const classes = ['tl-item', cardClass, cancelada ? 'tl-cancelada' : '',
    ev.outra_internacao ? 'tl-outra' : ''].filter(Boolean).join(' ')
  // Só a admissão carrega as ações da outra internação: repeti-las em cada
  // relatório de lá encheria a timeline de links iguais.
  const acoesDaOutra = ev.outra_internacao && ev.tipo === 'ADMISSAO' && ev.internacao_id != null

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
      {ev.outra_internacao && ev.tipo !== 'ADMISSAO' && ev.hospital_nome && (
        <div className="tl-hosp">{ev.hospital_nome}</div>
      )}
      {acoesDaOutra && (ev.acessivel || onDesvincular) && (
        <div className="tl-hosp">
          {ev.acessivel && <Link to={`/paciente/${ev.internacao_id}`}>Abrir esta internação</Link>}
          {onDesvincular && (
            <button type="button" onClick={() => onDesvincular(ev.internacao_id!)}>Não é este paciente</button>
          )}
        </div>
      )}
    </div>
  )
}
