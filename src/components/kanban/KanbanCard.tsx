// Roteador de card do quadro Kanban: escolhe o layout pela natureza da tarefa.
//
// As três colunas não são estágios de um mesmo item: cada uma tem uma fonte e um
// formato próprios (paciente, hospital em cobrança, relatório a analisar). Este
// componente só decide qual card desenhar; cada layout mora no seu arquivo.
import { memo } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { CobrancaCard } from './CobrancaCard'
import { PacienteCard } from './PacienteCard'

// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
export const KanbanCard = memo(function KanbanCard({ tarefa, onAbrir, onPrefetch, onCobrar, cobrando, somenteLeitura }: {
  tarefa: KanbanTarefa
  corBg: string
  onAbrir: (t: KanbanTarefa) => void
  onPrefetch: (id: number) => void
  /** true = perfil de observação: os botões de ação do card não aparecem. */
  somenteLeitura?: boolean
  onCobrar: (t: KanbanTarefa) => void
  cobrando: boolean
}) {
  // Card de COBRANÇA (coluna "Cobrar censo") — por hospital, não por paciente.
  if (tarefa.cobranca_id != null) {
    return <CobrancaCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando}
                        somenteLeitura={somenteLeitura} />
  }
  // Card de PACIENTE: o resto do quadro (colunas derivadas de internação).
  return <PacienteCard tarefa={tarefa} onAbrir={onAbrir} onPrefetch={onPrefetch} />
})
