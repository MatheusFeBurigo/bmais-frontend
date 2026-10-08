// Timeline da internação com seus estados (carregando, erro, vazia, lista).
// O contêiner da lista vem de quem usa: a ficha rola dentro de um card de altura
// travada (`tl-scroll`); o drawer limita a altura porque o próprio drawer já rola.
import type { CSSProperties } from 'react'
import { LoadingState } from '../ui'
import { ordenarRecentePrimeiro } from '../../lib/timeline'
import type { TimelineEvento } from '../../types/api'
import { TimelineItem } from './TimelineItem'

// O evento que abre a ficha do relatório mostra que é clicável.
const estilos = `
.tl-clicavel{cursor:pointer}
.tl-clicavel:hover .tl-label{text-decoration:underline;text-underline-offset:2px}
.tl-clicavel:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}
`

export function TimelineEventos({ eventos, carregando, erro, className = 'tl', style, onDesvincular, onAbrirRelatorio }: {
  eventos: TimelineEvento[] | undefined
  carregando: boolean
  erro: boolean
  className?: string
  style?: CSSProperties
  /** Ficha do paciente: desliga outra internação desta pessoa. */
  onDesvincular?: (internacaoId: number) => void
  /** Clique num relatório (ou na troca de acomodação): abre a ficha do relatório. */
  onAbrirRelatorio?: (ev: TimelineEvento) => void
}) {
  if (carregando) return <LoadingState label="Carregando timeline…" size={22} style={{ padding: '24px 8px' }} />
  if (erro) return <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar a timeline.</div>
  if (!eventos) return null
  if (eventos.length === 0) return <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Sem eventos registrados.</div>
  return (
    // Mais recente no topo, nas duas telas.
    <div className={className} style={style}>
      {onAbrirRelatorio && <style>{estilos}</style>}
      {ordenarRecentePrimeiro(eventos).map((ev, i) => (
        <TimelineItem key={i} ev={ev} onDesvincular={onDesvincular} onAbrirRelatorio={onAbrirRelatorio} />
      ))}
    </div>
  )
}
