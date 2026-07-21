// Hook de estado de servidor do domínio "internação".
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  editarInternacao,
  fetchInternacaoDados,
  fetchInternacaoTimeline,
  type InternacaoEdicao,
} from '../services/internacao.service'

// Reabrir o mesmo paciente (ou um já pré-carregado no hover) não deve refazer a
// busca: mantém fresco por 1min.
const DRAWER_STALE = 60_000

export function useInternacaoDados(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoDados(id),
    queryFn: () => fetchInternacaoDados(id),
    staleTime: DRAWER_STALE,
  })
}

export function useInternacaoTimeline(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoTimeline(id),
    queryFn: () => fetchInternacaoTimeline(id),
    staleTime: DRAWER_STALE,
  })
}

// Edição dos dados da internação. Ao concluir, invalida dados + timeline: a
// própria edição gera um evento EDIT que precisa aparecer na timeline, e os
// KPIs derivados (status_relatorio etc.) podem mudar conforme os campos alterados.
export function useEditarInternacao(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mudancas: InternacaoEdicao) => editarInternacao(id, mudancas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(id) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(id) })
    },
  })
}

// Prefetch em background: dispara dados + timeline ANTES do clique (ex.: no hover
// da linha). Quando o usuário abre o drawer, os dados já estão no cache do
// react-query e ele renderiza instantâneo. Idempotente e barato (prefetchQuery
// não refaz se já está fresco).
export function usePrefetchInternacao() {
  const qc = useQueryClient()
  return useCallback((id: number) => {
    qc.prefetchQuery({
      queryKey: queryKeys.internacaoDados(id),
      queryFn: () => fetchInternacaoDados(id),
      staleTime: DRAWER_STALE,
    })
    qc.prefetchQuery({
      queryKey: queryKeys.internacaoTimeline(id),
      queryFn: () => fetchInternacaoTimeline(id),
      staleTime: DRAWER_STALE,
    })
  }, [qc])
}
