// Hooks de estado de servidor do domínio "dashboard".
//
// Casam a queryKey canônica (lib/queryKeys) com o serviço (services/dashboard).
// A tela consome useDashboard/useSidebar e recebe o resultado do React Query já
// pronto — sem montar queryKey, sem chamar apiFetch, sem conhecer o endpoint.

import { useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  fetchDashboard,
  fetchDashboardOverview,
  fetchSidebar,
  type DashboardParams,
} from '../services/dashboard.service'

/**
 * Panorama de TODAS as operadoras num único disparo (stats + hospitais). Alimenta
 * os KPIs e o seletor de qualquer operadora sem 1 request por operadora. staleTime
 * generoso: é dado de panorama, muda só com upload/config (que invalidam o cache).
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboardOverview(),
    queryFn: fetchDashboardOverview,
    staleTime: 60_000,
  })
}

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: queryKeys.dashboard(params.operadora, params.filtro, params.hospital ?? ''),
    queryFn: () => fetchDashboard(params),
    // Ao trocar de operadora, mantém os dados da anterior visíveis enquanto a
    // nova carrega — evita o "flash" de tela vazia na navegação por operadora.
    placeholderData: keepPreviousData,
  })
}

/**
 * Devolve uma função que pré-carrega (em background) o dashboard de uma operadora,
 * com a MESMA queryKey/queryFn de useDashboard. Usada no hover da sidebar: ao
 * clicar, os dados já estão no cache → troca instantânea, sem novo round-trip.
 * Respeita o staleTime — não refaz fetch se o cache ainda está fresco.
 */
export function usePrefetchDashboard() {
  const qc = useQueryClient()
  return useCallback((operadora: string, filtro = 'todos', hospital = '') => {
    const params: DashboardParams = { operadora, filtro, hospital }
    qc.prefetchQuery({
      queryKey: queryKeys.dashboard(operadora, filtro, hospital),
      queryFn: () => fetchDashboard(params),
      staleTime: 60_000,
    })
  }, [qc])
}

export function useSidebar() {
  return useQuery({
    queryKey: queryKeys.sidebar(),
    queryFn: fetchSidebar,
    staleTime: 30_000,
  })
}
