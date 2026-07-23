// Item da lista de profissionais (apresentação pura). Extraído de pages/Equipe.tsx.
import type { Profissional } from '../../types/api'
import { Badge } from '../ui'
import { TIPO_LABEL, isAtivo } from './equipe.styles'

export default function ProfItem({ p, active, onClick }: { p: Profissional; active: boolean; onClick: () => void }) {
  return (
    <div className={`prof-item${active ? ' active' : ''}${!isAtivo(p) ? ' inativo' : ''}`} onClick={onClick}>
      <div className={`prof-avatar ${p.tipo}`}>{p.nome.slice(0, 2).toUpperCase()}</div>
      <div className="flex-1 truncate">
        <div className="fw-6 truncate" style={{ fontSize: 'var(--t-base)' }}>{p.nome}</div>
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{TIPO_LABEL[p.tipo]}</div>
      </div>
      {isAtivo(p) ? <Badge variant="success" dot>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
    </div>
  )
}
