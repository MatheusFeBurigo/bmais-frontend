// Busca no catálogo TUSS do relatório completo (0054).
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { buscarTuss } from '../services/internacao.service'
import { useDebounce } from './useCid'

/** Procedimentos que casam com o texto (os mais usados quando vazio). Só busca
 *  com a lista aberta (`ativo`). O catálogo não muda com o uso. */
export function useTussBusca(texto: string, ativo: boolean) {
  const digitado = texto.trim()
  const q = useDebounce(digitado, 250)
  const query = useQuery({
    queryKey: queryKeys.tussBusca(q),
    queryFn: () => buscarTuss(q),
    enabled: ativo,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
  return {
    itens: query.data?.itens ?? [],
    // True enquanto a lista ainda não responde ao que está digitado.
    carregando: ativo && (q !== digitado || query.isPlaceholderData || query.isFetching),
  }
}
