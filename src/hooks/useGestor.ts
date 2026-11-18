// Hook de estado de servidor do domínio "gestor".
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import { fetchGestor, type GestorParams } from '../services/gestor.service'

export function useGestor(params: GestorParams) {
  return useQuery({
    queryKey: queryKeys.gestor(
      params.data ?? '', params.operadora ?? '', params.hospital ?? '', params.regiao ?? '',
      params.janela ?? '30d', params.inicio ?? '', params.fim ?? '',
    ),
    queryFn: () => fetchGestor(params),
    // Ao trocar o dia/filtros a queryKey muda; sem isto o react-query zera `data`
    // e a tela "recarrega" (pisca o loading). keepPreviousData mantém o painel
    // anterior visível durante o refetch — a troca vira uma transição suave.
    placeholderData: keepPreviousData,
    // 18/11/2026: o painel ficava parado quando outra pessoa aprovava um
    // relatório com home care, prorrogação ou folha rosa (a invalidação por
    // evento só cobre esta aba). Agora segue a mesma política da Visão Geral.
    ...opcoesAutoRefresh,
  })
}
