// CID do paciente: busca no catálogo CID-10 e atribuição pelo técnico.
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { atribuirCid, buscarCid, consultarCid, removerCid } from '../services/internacao.service'

// O catálogo não muda com o uso: a mesma busca nunca precisa ser refeita.
const CATALOGO_STALE = Infinity

function useDebounce(valor: string, ms: number): string {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

/** Sugestões do catálogo para o que está digitado. Uma letra só não busca:
 *  casaria o catálogo inteiro. */
export function useCidBusca(texto: string) {
  const q = useDebounce(texto.trim(), 250)
  const query = useQuery({
    queryKey: queryKeys.cidBusca(q),
    queryFn: () => buscarCid(q),
    enabled: q.length >= 2,
    staleTime: CATALOGO_STALE,
  })
  return {
    itens: q.length >= 2 ? query.data?.itens ?? [] : [],
    // Também "carregando" enquanto o debounce não alcançou o que foi digitado:
    // senão a lista diria "nenhum CID" por um instante a cada tecla.
    carregando: texto.trim().length >= 2 && (query.isFetching || q !== texto.trim()),
    erro: query.isError,
  }
}

/** Um CID exato do catálogo, com a hierarquia. Serve o CID já gravado no
 *  paciente, que o drawer mostra com categoria, grupo e capítulo. */
export function useCidDetalhe(codigo: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.cidDetalhe(codigo ?? ''),
    queryFn: () => consultarCid(codigo as string),
    enabled: !!codigo,
    staleTime: CATALOGO_STALE,
  })
}

/** Atribuir / remover o CID. Ao terminar, o drawer relê os dados do paciente. */
export function useCidPaciente(internacaoId: number) {
  const qc = useQueryClient()
  const aoTerminar = () => qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
  const atribuir = useMutation({
    mutationFn: (codigo: string) => atribuirCid(internacaoId, codigo),
    onSuccess: aoTerminar,
  })
  const remover = useMutation({
    mutationFn: () => removerCid(internacaoId),
    onSuccess: aoTerminar,
  })
  return { atribuir, remover }
}
