// Roteador de card do quadro Kanban: escolhe o layout pela natureza da tarefa.
//
// Os cards não são do mesmo item: cada um tem uma fonte e um formato próprios
// (paciente, ou hospital no fluxo de censos). Este
// componente só decide qual card desenhar; cada layout mora no seu arquivo.
import { memo } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { CensoCard } from './CensoCard'
import { PacienteCard } from './PacienteCard'

// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
export const KanbanCard = memo(function KanbanCard({
  tarefa, onAbrir, onPrefetch, onCobrar, onDesfazer, onAbrirHospital, cobrando, somenteLeitura,
}: {
  tarefa: KanbanTarefa
  corBg: string
  onAbrir: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
  /** true = perfil de observação: os botões de ação do card não aparecem. */
  somenteLeitura?: boolean
  onCobrar: (t: KanbanTarefa) => void
  /** Cards de censo: desfazer a cobrança e abrir a ficha do hospital. */
  onDesfazer?: (t: KanbanTarefa) => void
  onAbrirHospital?: (t: KanbanTarefa) => void
  /** Ação em andamento NESTE card (não no quadro inteiro). */
  cobrando: boolean
}) {
  // Card do fluxo de CENSOS — por hospital, não por paciente.
  if (tarefa.estado_censo) {
    return <CensoCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando}
                      onDesfazer={onDesfazer ? () => onDesfazer(tarefa) : undefined}
                      onAbrir={onAbrirHospital ? () => onAbrirHospital(tarefa) : undefined}
                      somenteLeitura={somenteLeitura} />
  }
  // Card de PACIENTE: o resto do quadro (colunas derivadas de internação).
  return <PacienteCard tarefa={tarefa} onAbrir={onAbrir} onPrefetch={onPrefetch} />
})
