// Hook de estado de servidor do domínio "kanban" (tarefas do analista).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import { queryKeys } from '../lib/queryKeys'
import { desfazerCobranca, fetchKanban, marcarCobrado, type CensoAlvo } from '../services/kanban.service'
import type { EstadoCenso, KanbanPayload, KanbanTarefa } from '../types/api'

// O quadro reflete pendências, status de relatório e o fluxo de censos: dado que
// muda ao importar censos ou registrar relatórios. O envio feito NESTA aba já
// invalida o quadro (evento dadosAlterados); o polling cobre o censo que chega
// por outra pessoa ou outra aba, para o card andar de coluna sem F5.
export function useKanban() {
  return useQuery({
    queryKey: queryKeys.kanban(),
    queryFn: fetchKanban,
    ...opcoesAutoRefresh,
  })
}

// Move o card de um hospital entre duas colunas de censo no cache, na hora
// (otimista). O invalidate logo depois traz a coluna de verdade do backend.
function moverCenso(
  atual: KanbanPayload | undefined, alvo: CensoAlvo,
  de: EstadoCenso, para: EstadoCenso, extra: Partial<KanbanTarefa>,
): KanbanPayload | undefined {
  if (!atual?.tarefas) return atual
  const origem = atual.tarefas[de] ?? []
  // Hospital E operadora: o mesmo hospital tem um card por operadora.
  const eh = (t: KanbanTarefa) =>
    t.hospital_key === alvo.hospitalKey && (t.operadora_key ?? '') === alvo.operadoraKey
  const card = origem.find(eh)
  if (!card) return atual
  return {
    ...atual,
    tarefas: {
      ...atual.tarefas,
      [de]: origem.filter((t) => !eh(t)),
      [para]: [...(atual.tarefas[para] ?? []), { ...card, ...extra, coluna: para, estado_censo: para }],
    },
  }
}

// Marcar cobrado: "Censos atrasados" → "Aguardando retorno".
export function useMarcarCobrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alvo: CensoAlvo) => marcarCobrado(alvo),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'censos_atrasados', 'aguardando_retorno',
        { cobrado_em: new Date().toISOString() }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}

// Desfazer: "Aguardando retorno" → "Censos atrasados", sem autor da cobrança.
export function useDesfazerCobranca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alvo: CensoAlvo) => desfazerCobranca(alvo),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'aguardando_retorno', 'censos_atrasados',
        { cobrado_em: null, cobrado_por: null }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}
