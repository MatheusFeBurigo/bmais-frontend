// Hook de estado de servidor do domínio "kanban" (tarefas do analista).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchKanban, resolverPendencia, marcarCobrado, concluirAnalise } from '../services/kanban.service'
import type { KanbanPayload, ConcluirAnalisePayload } from '../types/api'

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

// Resolver uma pendência de parsing tira o card da coluna "refazer análise".
// Remove o card do cache na hora (otimista) e invalida para reconciliar com o servidor.
export function useResolverPendencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pendenciaId: number) => resolverPendencia(pendenciaId),
    onSuccess: (_res, pendenciaId) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => {
        if (!atual?.tarefas) return atual
        return {
          ...atual,
          tarefas: {
            ...atual.tarefas,
            refazer_analise: (atual.tarefas.refazer_analise ?? []).filter(
              (t) => t.pendencia_id !== pendenciaId,
            ),
          },
        }
      })
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
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

// Concluir uma análise técnica tira o card da coluna "Análise técnica" (board do técnico).
// Grava o parecer interno no backend; aqui remove o card na hora + invalida.
export function useConcluirAnalise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ analiseId, payload }: { analiseId: number; payload: ConcluirAnalisePayload }) =>
      concluirAnalise(analiseId, payload),
    onSuccess: (_res, { analiseId }) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => {
        if (!atual?.tarefas) return atual
        return {
          ...atual,
          tarefas: {
            ...atual.tarefas,
            analise_tecnica: (atual.tarefas.analise_tecnica ?? []).filter((t) => t.analise_id !== analiseId),
          },
        }
      })
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}
