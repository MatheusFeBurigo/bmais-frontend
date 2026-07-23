// Hooks de encaixe de relatório — ações dos cards da coluna "Revisão Relatório"
// do Kanban (pendências origem='relatorio'). A listagem não tem hook próprio: os
// cards já chegam no payload do Kanban. Aqui ficam confirmar, criar+encaixar e
// descartar — todos tiram o card da coluna quando resolvem a pendência.
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { confirmarEncaixeRelatorio, criarEncaixarRelatorio, descartarRevisaoRelatorio } from '../services/censos.service'
import type { ConfirmarEncaixePayload, CriarEncaixePayload, KanbanPayload } from '../types/api'

/** Remove o card da pendência do cache do Kanban IMEDIATAMENTE (remoção otimista),
 *  para o card sumir na hora sem esperar o refetch. A invalidação em seguida
 *  reconcilia o board com o servidor (contadores, eventuais mudanças de outras telas). */
function resolverCardKanban(qc: QueryClient, pendenciaId: number) {
  qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => {
    if (!atual?.tarefas) return atual
    return {
      ...atual,
      tarefas: {
        ...atual.tarefas,
        revisao_relatorio: (atual.tarefas.revisao_relatorio ?? []).filter(
          (t) => t.pendencia_id !== pendenciaId,
        ),
      },
    }
  })
  qc.invalidateQueries({ queryKey: queryKeys.kanban() })
}

// Confirmar o encaixe grava o relatório e resolve a pendência → o card sai do quadro.
export function useConfirmarEncaixe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pendenciaId, payload }: { pendenciaId: number; payload: ConfirmarEncaixePayload }) =>
      confirmarEncaixeRelatorio(pendenciaId, payload),
    onSuccess: (_res, { pendenciaId }) => resolverCardKanban(qc, pendenciaId),
  })
}

// Criar paciente não vinculado + encaixar num passo (card "Sem paciente vinculado").
// Cria a internação, grava o relatório e resolve a pendência → o card sai do quadro.
export function useCriarEncaixe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pendenciaId, payload }: { pendenciaId: number; payload: CriarEncaixePayload }) =>
      criarEncaixarRelatorio(pendenciaId, payload),
    onSuccess: (_res, { pendenciaId }) => resolverCardKanban(qc, pendenciaId),
  })
}

// Descartar remove a entrada sem gravar (falso positivo / não aplicável).
export function useDescartarRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pendenciaId: number) => descartarRevisaoRelatorio(pendenciaId),
    onSuccess: (_res, pendenciaId) => resolverCardKanban(qc, pendenciaId),
  })
}
