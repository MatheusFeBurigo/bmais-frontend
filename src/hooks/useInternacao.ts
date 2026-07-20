// Hook de estado de servidor do domínio "internação".
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchInternacaoDados, fetchInternacaoTimeline } from '../services/internacao.service'

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
