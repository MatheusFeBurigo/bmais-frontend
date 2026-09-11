// Card da coluna "Cobrar censo".
// Extraido de pages/Kanban.tsx (god component): apresentacao pura.
import type { KanbanTarefa } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { labelCurto } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'

// ── Card de cobrança de censo (coluna "Cobrar censo") ─────────────────────────
// Um card por HOSPITAL que não enviou o censo do dia anterior. Não abre paciente;
// a única ação é "marcar cobrado" (o analista contatou o hospital).
export function CobrancaCard({ tarefa, onCobrar, cobrando, somenteLeitura }: {
  tarefa: KanbanTarefa
  onCobrar: () => void
  cobrando: boolean
  /** true = perfil de observação: sem a ação "marcar como cobrado". */
  somenteLeitura?: boolean
}) {
  return (
    <article className="kb-card">
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.operadora_key}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(tarefa.titulo)}</span>
        {tarefa.dias_sem_censo != null && (
          <Badge variant={tarefa.dias_sem_censo > 3 ? 'danger' : 'warning'}>
            <span className="kb-dias">{tarefa.dias_sem_censo}d</span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Censo faltante de </span>
          {labelCurto(tarefa.data_ref) || '-'}
        </span>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Último censo </span>
          {tarefa.ultimo_censo
            ? `${labelCurto(tarefa.ultimo_censo)}${tarefa.dias_sem_censo != null ? ` (há ${tarefa.dias_sem_censo}d)` : ''}`
            : 'nunca enviou'}
        </span>
      </div>

      {!somenteLeitura && (
        <div className="kb-card-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={cobrando}
            onClick={onCobrar}
          >
            {cobrando ? 'Registrando…' : 'Marcar como cobrado'}
          </button>
        </div>
      )}
    </article>
  )
}
