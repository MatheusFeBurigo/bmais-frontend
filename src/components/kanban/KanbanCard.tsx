// Card de tarefa do quadro Kanban.
// Extraido de pages/Kanban.tsx (god component): apresentacao pura, sem fetch.
import { memo } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { nomeProprio } from '../../lib/texto'
import { CobrancaCard } from './CobrancaCard'
import { AnaliseCard } from './AnaliseCard'

// ── Card de tarefa ────────────────────────────────────────────────────────────
// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
export const KanbanCard = memo(function KanbanCard({ tarefa, onAbrir, onAbrirAnalise, onPrefetch, onCobrar, cobrando, somenteLeitura }: {
  tarefa: KanbanTarefa
  corBg: string
  onAbrir: (t: KanbanTarefa) => void
  onAbrirAnalise: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
  /** true = perfil de observação: os botões de ação do card não aparecem. */
  somenteLeitura?: boolean
  onCobrar: (t: KanbanTarefa) => void
  cobrando: boolean
}) {
  // Card de ANÁLISE TÉCNICA (board do técnico) — clica para abrir a modal de parecer.
  if (tarefa.analise_id != null) {
    return <AnaliseCard tarefa={tarefa} onAbrir={() => onAbrirAnalise(tarefa)} />
  }
  // Card de COBRANÇA (coluna "Cobrar censo") — por hospital, não por paciente. Tem
  // layout próprio (sem drawer/modal), então retorna cedo.
  if (tarefa.cobranca_id != null) {
    return <CobrancaCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando}
                        somenteLeitura={somenteLeitura} />
  }

  const clicavel = tarefa.internacao_id != null

  function onClickCard() {
    if (tarefa.internacao_id != null) onAbrir(tarefa)
  }
  // Prefetch dos dados do drawer no hover/foco (só quando há internação).
  const prefetchAoFocar = tarefa.internacao_id != null
    ? () => onPrefetch(tarefa.internacao_id as number)
    : undefined

  return (
    <article
      className={`kb-card${clicavel ? ' clicavel' : ''}`}
      onClick={clicavel ? onClickCard : undefined}
      onMouseEnter={prefetchAoFocar}
      onFocus={prefetchAoFocar}
    >
      {clicavel && (
        <span className="kb-card-abrir" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </span>
      )}
      <div className="kb-card-top">
        {tarefa.operadora_key && (
          <span title={tarefa.hospital_nome ?? undefined}>
            <OpAvatar opKey={tarefa.operadora_key} size={20} />
          </span>
        )}
        <span className="kb-card-nome">{nomeProprio(tarefa.titulo)}</span>
        {tarefa.dias_sem_relatorio != null && (
          <Badge variant={tarefa.dias_sem_relatorio > 7 ? 'danger' : 'warning'}>
            <span className="kb-dias">{tarefa.dias_sem_relatorio}d</span>
          </Badge>
        )}
      </div>

      <div className="kb-card-meta">
        {tarefa.hospital_nome && <span>{tarefa.hospital_nome}</span>}
        {tarefa.atendimento && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span className="kb-card-atend">{tarefa.atendimento}</span>
          </>
        )}
      </div>
    </article>
  )
})
