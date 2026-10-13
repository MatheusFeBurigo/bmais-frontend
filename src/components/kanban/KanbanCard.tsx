// Roteador de card do quadro Kanban: escolhe o layout pela natureza da tarefa.
//
// Os cards não são do mesmo item: cada um tem uma fonte e um formato próprios
// (paciente, relatório em aprovação, ou hospital no fluxo de censos). Este
// componente só decide qual card desenhar; cada layout mora no seu arquivo.
import { memo } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { AprovacaoCard } from './AprovacaoCard'
import { CensoCard } from './CensoCard'
import { PacienteCard } from './PacienteCard'

// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
export const KanbanCard = memo(function KanbanCard({
  tarefa, onAbrir, onPrefetch, onCobrar, onDesfazer, onAtualizar, onDesfazerAtualizado,
  onAbrirCenso, onAbrirAprovacao, cobrando, somenteLeitura,
}: {
  tarefa: KanbanTarefa
  corBg: string
  onAbrir: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
  /** true = perfil de observação: os botões de ação do card não aparecem. */
  somenteLeitura?: boolean
  onCobrar: (t: KanbanTarefa) => void
  /** Cards de censo: desfazer a cobrança. */
  onDesfazer?: (t: KanbanTarefa) => void
  /** Hospital cobrado respondeu que não há censo novo: dá o dia por atualizado. */
  onAtualizar?: (t: KanbanTarefa) => void
  onDesfazerAtualizado?: (t: KanbanTarefa) => void
  /** Card de censo: abre o drawer com a timeline de anotações. */
  onAbrirCenso?: (t: KanbanTarefa) => void
  /** Ação em andamento NESTE card (não no quadro inteiro). */
  cobrando: boolean
  /** Card de aprovação: leva à ficha do paciente com o relatório aberto, onde
   *  se aprova, devolve ou corrige (13/10/2026). Sem isto, abre como paciente. */
  onAbrirAprovacao?: (t: KanbanTarefa) => void
}) {
  // Card do fluxo de CENSOS — por hospital, não por paciente.
  if (tarefa.estado_censo) {
    return <CensoCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando}
                      onDesfazer={onDesfazer ? () => onDesfazer(tarefa) : undefined}
                      onAtualizar={onAtualizar ? () => onAtualizar(tarefa) : undefined}
                      onDesfazerAtualizado={onDesfazerAtualizado ? () => onDesfazerAtualizado(tarefa) : undefined}
                      onAbrir={onAbrirCenso ? () => onAbrirCenso(tarefa) : undefined}
                      somenteLeitura={somenteLeitura} />
  }
  // Card de RELATÓRIO em aprovação: um por relatório, não por paciente.
  if (tarefa.relatorio) {
    return <AprovacaoCard tarefa={tarefa} onAbrir={onAbrirAprovacao ?? onAbrir} onPrefetch={onPrefetch} />
  }
  // Card de PACIENTE: o resto do quadro (colunas derivadas de internação).
  return <PacienteCard tarefa={tarefa} onAbrir={onAbrir} onPrefetch={onPrefetch} />
})
