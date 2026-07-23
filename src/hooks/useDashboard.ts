// Hooks de estado de servidor do domínio "dashboard".
//
// Casam a queryKey canônica (lib/queryKeys) com o serviço (services/dashboard).
// A tela consome useDashboard/useSidebar e recebe o resultado do React Query já
// pronto — sem montar queryKey, sem chamar apiFetch, sem conhecer o endpoint.

import { useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  fetchDashboard,
  fetchDashboardOverview,
  fetchSidebar,
  getSidebarCache,
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

export function useDashboard(params: DashboardParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboard(params.operadora, params.filtro, params.hospital ?? ''),
    queryFn: () => fetchDashboard(params),
    // Ao trocar de operadora, mantém os dados da anterior visíveis enquanto a
    // nova carrega — evita o "flash" de tela vazia na navegação por operadora.
    placeholderData: keepPreviousData,
    // `dashboard_payload` NÃO é cacheado no backend (~7 round-trips por request).
    // Sem staleTime, cada remontagem (renavegar de volta à Visão Geral) refazia
    // esses round-trips. 60s serve o cache instantaneamente ao renavegar, coerente
    // com useDashboardOverview/usePrefetchDashboard; a invalidação por evento
    // (dadosAlterados) continua refazendo o fetch quando um upload/edição ocorre.
    staleTime: 60_000,
    // Permite adiar o fetch até haver uma operadora efetiva (evita disparar com
    // um valor de fallback fora do escopo do usuário).
    enabled: opts?.enabled ?? true,
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
  // Hidrata da persistência (localStorage) para a Sidebar já pintar operadoras e
  // badge na 1ª renderização após um reload — sem o "flash vazio". initialData
  // fica disponível de imediato; initialDataUpdatedAt=0 marca-o como velho para
  // o React Query revalidar em background (o /sidebar continua a fonte de verdade).
  return useQuery({
    queryKey: queryKeys.sidebar(),
    queryFn: fetchSidebar,
    staleTime: 30_000,
    initialData: getSidebarCache() ?? undefined,
    initialDataUpdatedAt: 0,
  })
}

/**
 * Atualiza a Visão Geral inteira: invalida (e refaz) as TRÊS queries que a
 * compõem — o detalhe (`dashboard`), o panorama de KPIs/hospitais
 * (`dashboard-overview`) e a sidebar (`sidebar`). O botão "Atualizar" antes só
 * refazia o detalhe (`refetch` da lista), deixando KPIs e "N internados" com o
 * valor cacheado. `refetchType: 'active'` refaz na hora só o que está montado.
 * Devolve a Promise para a UI marcar "Atualizando…" até tudo voltar.
 */
export function useAtualizarVisaoGeral() {
  const qc = useQueryClient()
  return useCallback(() => {
    return Promise.all([
      qc.invalidateQueries({ queryKey: queryRoots.dashboard }),
      qc.invalidateQueries({ queryKey: queryRoots.dashboardOverview }),
      qc.invalidateQueries({ queryKey: queryRoots.sidebar }),
    ])
  }, [qc])
}
