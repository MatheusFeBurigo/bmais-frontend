// Hook de estado de servidor do domínio "kanban" (tarefas do analista).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchKanban, marcarCobrado } from '../services/kanban.service'
import type { KanbanPayload } from '../types/api'

// O quadro reflete pendências e status de relatório — dado que muda ao importar
// censos ou registrar relatórios. Mantém fresco por 30s; a invalidação por evento
// (dadosAlterados) já refaz o fetch quando um upload/edição acontece.
const KANBAN_STALE = 30_000

export function useKanban() {
  return useQuery({
    queryKey: queryKeys.kanban(),
    queryFn: fetchKanban,
    staleTime: KANBAN_STALE,
  })
}

// Marcar cobrado tira o card da coluna "Cobrar censo". Remoção otimista + invalidação.
export function useMarcarCobrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cobrancaId: number) => marcarCobrado(cobrancaId),
    onSuccess: (_res, cobrancaId) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => {
        if (!atual?.tarefas) return atual
        return {
          ...atual,
          tarefas: {
            ...atual.tarefas,
            cobrancas: (atual.tarefas.cobrancas ?? []).filter((t) => t.cobranca_id !== cobrancaId),
          },
        }
      })
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}
