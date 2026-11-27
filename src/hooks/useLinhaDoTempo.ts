// Estado de servidor da tela Linha do tempo. A trilha muda por fora o tempo todo
// (outros usuários agindo), então revalida sozinha como Movimentações, mas a cada
// minuto no mínimo: cada leitura conta o período inteiro (até 14 dias) no servidor.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { AUTO_REFRESH_MS, opcoesAutoRefresh } from '../lib/autoRefresh'
import { fetchLinhaDoTempo, type LinhaDoTempoParams } from '../services/linhaDoTempo.service'

export function useLinhaDoTempo(p: LinhaDoTempoParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.linhaDoTempo(p.periodo, p.area ?? '', p.operadora ?? '', p.quem ?? '',
      p.q ?? '', p.balde ?? '', p.limite ?? 0),
    queryFn: () => fetchLinhaDoTempo(p),
    // Ao trocar filtro, a lista anterior fica em tela até a nova chegar.
    placeholderData: keepPreviousData,
    ...opcoesAutoRefresh,
    refetchInterval: AUTO_REFRESH_MS > 0 ? Math.max(AUTO_REFRESH_MS, 60_000) : false,
    enabled,
  })
}
