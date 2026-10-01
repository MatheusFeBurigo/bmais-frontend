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
import { ProrrogacaoCard } from './ProrrogacaoCard'

// memo: só re-renderiza quando SUA tarefa/props mudam. Os handlers recebem a
// própria tarefa (bind interno), então o pai passa funções ESTÁVEIS (useCallback)
// em vez de arrows inline — sem isso o memo nunca acertaria e todos os cards
// re-renderizariam a cada setState do quadro.
export const KanbanCard = memo(function KanbanCard({
  tarefa, onAbrir, onPrefetch, onCobrar, onDesfazer, onAtualizar, onDesfazerAtualizado,
  onAbrirHospital, cobrando, somenteLeitura, podeAprovar = false, usuario, medicos, onAviso,
  podeControlarProrrogacao = false,
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
  /** Hospital cobrado respondeu que não há censo novo: dá o dia por atualizado. */
  onAtualizar?: (t: KanbanTarefa) => void
  onDesfazerAtualizado?: (t: KanbanTarefa) => void
  onAbrirHospital?: (t: KanbanTarefa) => void
  /** Ação em andamento NESTE card (não no quadro inteiro). */
  cobrando: boolean
  /** Aba de aprovação: o técnico aprova/devolve; o autor corrige o devolvido. */
  podeAprovar?: boolean
  /** Quem está logado (e-mail), para saber se o devolvido é dele. */
  usuario?: string | null
  medicos?: string[]
  onAviso?: (msg: string) => void
  /** Coluna "Em prorrogação": admin e administrativo pausam e retomam. */
  podeControlarProrrogacao?: boolean
}) {
  // Card do fluxo de CENSOS — por hospital, não por paciente.
  if (tarefa.estado_censo) {
    return <CensoCard tarefa={tarefa} onCobrar={() => onCobrar(tarefa)} cobrando={cobrando}
                      onDesfazer={onDesfazer ? () => onDesfazer(tarefa) : undefined}
                      onAtualizar={onAtualizar ? () => onAtualizar(tarefa) : undefined}
                      onDesfazerAtualizado={onDesfazerAtualizado ? () => onDesfazerAtualizado(tarefa) : undefined}
                      onAbrir={onAbrirHospital ? () => onAbrirHospital(tarefa) : undefined}
                      somenteLeitura={somenteLeitura} />
  }
  // Card de RELATÓRIO em aprovação: um por relatório, não por paciente.
  if (tarefa.relatorio) {
    const autor = tarefa.relatorio.autor?.toLowerCase()
    return <AprovacaoCard tarefa={tarefa} onAbrir={onAbrir}
                          podeAprovar={podeAprovar && !somenteLeitura}
                          podeCorrigir={!somenteLeitura && (podeAprovar || (!!autor && autor === usuario?.toLowerCase()))}
                          medicos={medicos ?? []} onAviso={onAviso ?? (() => {})} />
  }
  // Card da coluna "Em prorrogação". Pela coluna, não pelos campos: o card de
  // "Sem relatório" também traz `prorrogacao_ate` (a que terminou).
  if (tarefa.coluna === 'em_prorrogacao') {
    return <ProrrogacaoCard tarefa={tarefa} onAbrir={onAbrir}
                            podeControlar={podeControlarProrrogacao && !somenteLeitura}
                            onAviso={onAviso ?? (() => {})} />
  }
  // Card de PACIENTE: o resto do quadro (colunas derivadas de internação).
  return <PacienteCard tarefa={tarefa} onAbrir={onAbrir} onPrefetch={onPrefetch} />
})
