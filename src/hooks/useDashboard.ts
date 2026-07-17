// Hooks de estado de servidor do domínio "dashboard".
//
// Casam a queryKey canônica (lib/queryKeys) com o serviço (services/dashboard).
// A tela consome useDashboard/useSidebar e recebe o resultado do React Query já
// pronto — sem montar queryKey, sem chamar apiFetch, sem conhecer o endpoint.

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  fetchDashboard,
  fetchSidebar,
  type DashboardParams,
} from '../services/dashboard.service'

export function useDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: queryKeys.dashboard(params.operadora, params.filtro, params.hospital ?? ''),
    queryFn: () => fetchDashboard(params),
  })
}

export function useSidebar() {
  return useQuery({
    queryKey: queryKeys.sidebar(),
    queryFn: fetchSidebar,
    staleTime: 30_000,
  })
}
