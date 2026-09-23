// Card da coluna "Cobrar censo".
// Apresentação pura, extraído de pages/Kanban.tsx.
import type { KanbanTarefa } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { labelCurto } from '../../lib/datas'
import { nomeProprio } from '../../lib/texto'

// ── Card de cobrança de censo (coluna "Cobrar censo") ─────────────────────────
// Um card por HOSPITAL que não enviou o censo do dia anterior. Não abre paciente;
// a única ação é "marcar cobrado" (o analista contatou o hospital).
//
// O card mostra duas datas, e a diferença entre elas é o ponto:
//   * "Censo pendente de" é o dia que falta (`data_ref`, o que gerou a cobrança);
//   * "Última atualização" é o dia do censo mais recente que o hospital tem
//     processado (`ultimo_censo`), ou seja, até quando os dados dele valem.
//
// `ultimo_censo` é o DIA A QUE O CENSO SE REFERE (lido do cabeçalho do
// relatório), não o instante do upload. Contar pelo upload produzia o absurdo de
// "há 0 dias" ao lado de uma cobrança em aberto, porque quem sobe hoje um censo
// antigo não atualiza nada do que falta. Quando o relatório não declara a data,
// o backend cai no dia do upload e sinaliza em `data_declarada`.
export function CobrancaCard({ tarefa, onCobrar, cobrando, somenteLeitura }: {
  tarefa: KanbanTarefa
  onCobrar: () => void
  cobrando: boolean
  /** true = perfil de observação: sem a ação "marcar como cobrado". */
  somenteLeitura?: boolean
}) {
  const dias = tarefa.dias_sem_censo

  return (
    <article className="kb-card">
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.operadora_key}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(tarefa.titulo)}</span>
        {/* "20d" sozinho não diz de quê: o rótulo vem junto, no próprio badge. */}
        {dias != null && (
          <Badge variant={dias > 3 ? 'danger' : 'warning'}>
            <span title={`Última atualização há ${dias} dias`}>
              <span className="kb-dias">{dias}d</span>
              {' '}s/ atualizar
            </span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Censo pendente de </span>
          {labelCurto(tarefa.data_ref) || 'Sem data'}
        </span>
        <span>
          <span style={{ color: 'var(--muted-2)' }}>Última atualização </span>
          {tarefa.ultimo_censo
            ? `${labelCurto(tarefa.ultimo_censo)}${dias != null ? ` (há ${dias}d)` : ''}`
            : 'Nunca enviou'}
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
