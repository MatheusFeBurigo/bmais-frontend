// Hooks de estado de servidor do domínio "dashboard".
//
// Casam a queryKey canônica (lib/queryKeys) com o serviço (services/dashboard).
// A tela consome useDashboard/useSidebar e recebe o resultado do React Query já
// pronto — sem montar queryKey, sem chamar apiFetch, sem conhecer o endpoint.

import { useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import {
  fetchDashboard,
  fetchDashboardOverview,
  fetchSidebar,
  getSidebarCache,
  type DashboardParams,
} from '../services/dashboard.service'

/**
 * Panorama de TODAS as operadoras num único disparo (stats + hospitais). Alimenta
 * os KPIs e o seletor de qualquer operadora sem 1 request por operadora.
 * Revalida sozinho (polling com a aba visível + foco/reconexão — lib/autoRefresh)
 * para refletir ajustes feitos FORA desta aba: upload de outro analista, relatório
 * do técnico, cron. Mutações locais seguem pela invalidação por evento.
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboardOverview(),
    queryFn: fetchDashboardOverview,
    ...opcoesAutoRefresh,
  })
}

export function useDashboard(params: DashboardParams, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboard(params.operadora, params.filtro, params.hospital ?? ''),
    queryFn: () => fetchDashboard(params),
    // Ao trocar de operadora, mantém os dados da anterior visíveis enquanto a
    // nova carrega — evita o "flash" de tela vazia na navegação por operadora.
    placeholderData: keepPreviousData,
    // Mesma política de revalidação automática do panorama (staleTime incluído):
    // renavegar dentro do intervalo serve o cache na hora; o polling e o foco da
    // aba trazem ajustes feitos por fora; a invalidação por evento (dadosAlterados,
    // relatorioAdicionado…) segue refazendo o fetch nas mutações desta aba.
    ...opcoesAutoRefresh,
    // Permite adiar o fetch até haver uma operadora efetiva (evita disparar com
    // um valor de fallback fora do escopo do usuário). Com enabled=false o
    // polling também fica parado.
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
      staleTime: opcoesAutoRefresh.staleTime,
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
    // A Sidebar fica montada em todas as telas: o polling daqui mantém as
    // contagens/alertas por operadora acompanhando o backend no app inteiro
    // (é o payload mais barato — cacheado globalmente no servidor).
    ...opcoesAutoRefresh,
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
