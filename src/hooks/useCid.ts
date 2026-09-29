// CIDs do paciente: busca no catálogo CID-10 e vínculo pelo técnico.
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { adicionarCid, buscarCid, fetchInternacaoCids, removerCid } from '../services/internacao.service'

// O catálogo não muda com o uso: a mesma busca nunca precisa ser refeita.
const CATALOGO_STALE = Infinity
// Mesmo prazo dos demais dados da ficha (useInternacao).
const FICHA_STALE = 60_000

function useDebounce(valor: string, ms: number): string {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

/** A lista de CIDs do campo: o catálogo inteiro quando nada foi digitado, ou o
 *  que casa com o texto. Vem em páginas, pedidas conforme a rolagem: são 14 mil
 *  códigos. Só busca com a lista aberta (`ativo`), para a ficha não carregar o
 *  catálogo de quem nem clicou no campo. */
export function useCidBusca(texto: string, ativo: boolean) {
  const digitado = texto.trim()
  const q = useDebounce(digitado, 250)
  const query = useInfiniteQuery({
    queryKey: queryKeys.cidBusca(q),
    queryFn: ({ pageParam }) => buscarCid(q, pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultima, paginas) =>
      ultima.tem_mais ? paginas.reduce((n, p) => n + p.itens.length, 0) : undefined,
    enabled: ativo,
    staleTime: CATALOGO_STALE,
    // A lista anterior fica na tela até a nova chegar: sem isto ela sumia e
    // voltava a cada tecla.
    placeholderData: keepPreviousData,
  })
  const itens = useMemo(() => query.data?.pages.flatMap((p) => p.itens) ?? [], [query.data])
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const carregarMais = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  return {
    itens,
    // True enquanto `itens` ainda NÃO é a resposta ao que está digitado: a
    // busca em curso e também a espera do debounce. Quem escolhe por conta
    // própria (Enter, código completo) tem de esperar isto baixar, senão
    // escolhe da lista anterior.
    carregando: ativo && (q !== digitado || query.isPlaceholderData
      || (query.isFetching && !isFetchingNextPage)),
    carregandoMais: isFetchingNextPage,
    carregarMais,
    erro: query.isError,
  }
}

/** Os CIDs do paciente, com adicionar e remover. Ao terminar, relê a lista e a
 *  timeline da ficha, que ganha o evento do que acabou de acontecer. */
export function useCidsPaciente(internacaoId: number) {
  const qc = useQueryClient()
  const lista = useQuery({
    queryKey: queryKeys.internacaoCids(internacaoId),
    queryFn: () => fetchInternacaoCids(internacaoId),
    staleTime: FICHA_STALE,
  })
  const aoTerminar = () => {
    // A timeline não segura o fim da gravação: ela se atualiza por conta própria.
    void qc.invalidateQueries({ queryKey: queryKeys.internacaoTimelineFicha(internacaoId) })
    return qc.invalidateQueries({ queryKey: queryKeys.internacaoCids(internacaoId) })
  }
  const adicionar = useMutation({
    mutationFn: (codigo: string) => adicionarCid(internacaoId, codigo),
    onSuccess: aoTerminar,
  })
  const remover = useMutation({
    mutationFn: (cidId: number) => removerCid(internacaoId, cidId),
    onSuccess: aoTerminar,
  })
  return { lista, adicionar, remover }
}
