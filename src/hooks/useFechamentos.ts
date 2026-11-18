// Hooks do Módulo 2 > Fechamentos (agenda de fechamentos de contas, 0063).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  cancelarFechamento, fetchFechamentos, lancarFechamento, nomearNoFechamento,
  type NovoFechamento, type Papel,
} from '../services/fechamentos.service'

const LISTA_MS = 30_000

export function useFechamentos(de: string, ate: string) {
  return useQuery({
    queryKey: queryKeys.fechamentos(de, ate),
    queryFn: () => fetchFechamentos(de, ate),
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

// Toda escrita muda a lista (e a de outras semanas, se a data mudou): invalida a raiz.
function useEscrita<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryRoots.fechamentos }),
  })
}

export function useLancarFechamento() {
  return useEscrita((body: NovoFechamento) => lancarFechamento(body))
}

export function useNomearNoFechamento() {
  return useEscrita((v: { id: number; papel: Papel; profissional_id: number | null; motivo: string | null }) =>
    nomearNoFechamento(v.id, { papel: v.papel, profissional_id: v.profissional_id, motivo: v.motivo }))
}

export function useCancelarFechamento() {
  return useEscrita((v: { id: number; motivo: string | null }) => cancelarFechamento(v.id, v.motivo))
}
