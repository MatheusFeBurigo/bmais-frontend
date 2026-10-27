// Pendências avulsas da equipe: leitura, as ações e o aviso de pendência nova.
// Toda ação recompõe as listas de pendências (por prefixo) e a Distribuição,
// que conta as abertas.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  concluirPendencia, criarPendencia, excluirPendencia, fetchEquipePendencias,
  fetchMinhasPendencias, fetchPendenciasDaPessoa, fetchPendenciasNovas, marcarPendenciasVistas,
  moverPendencia, type MovimentoPendencia,
} from '../services/pendencias.service'
import type { NovaPendencia } from '../types/api'

// O aviso é consultado de toda tela, como o de chamados não lidos: o ritmo é o
// do aviso do menu (useChamados), não o de uma lista aberta.
const AVISO_MS = 60_000

export function useMinhasPendencias() {
  return useQuery({
    queryKey: queryKeys.pendencias(),
    queryFn: fetchMinhasPendencias,
    staleTime: 30_000,
  })
}

export function usePendenciasDaPessoa(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.pendenciasDaPessoa(userId ?? ''),
    queryFn: () => fetchPendenciasDaPessoa(userId as string),
    enabled: userId != null,
    staleTime: 30_000,
  })
}

export function useEquipePendencias(ativo: boolean) {
  return useQuery({
    queryKey: queryKeys.pendenciasEquipe(),
    queryFn: fetchEquipePendencias,
    enabled: ativo,
    staleTime: 5 * 60_000,
  })
}

function useAoMudar() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: queryRoots.pendencias })
    qc.invalidateQueries({ queryKey: queryRoots.volumetria })
  }
}

export function useCriarPendencia() {
  const aoMudar = useAoMudar()
  return useMutation({ mutationFn: (p: NovaPendencia) => criarPendencia(p), onSuccess: aoMudar })
}

export function useConcluirPendencia() {
  const aoMudar = useAoMudar()
  return useMutation({ mutationFn: (id: number) => concluirPendencia(id), onSuccess: aoMudar })
}

export function useExcluirPendencia() {
  const aoMudar = useAoMudar()
  return useMutation({ mutationFn: (id: number) => excluirPendencia(id), onSuccess: aoMudar })
}

export function useMoverPendencia() {
  const aoMudar = useAoMudar()
  return useMutation({
    mutationFn: ({ id, para }: { id: number; para: MovimentoPendencia }) => moverPendencia(id, para),
    onSuccess: aoMudar,
  })
}

/** As recebidas que a pessoa ainda não viu (o aviso de toda tela). */
export function usePendenciasNovas(ativo: boolean) {
  return useQuery({
    queryKey: queryKeys.pendenciasNovas(),
    queryFn: fetchPendenciasNovas,
    enabled: ativo,
    refetchInterval: AVISO_MS,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    // Acessório: falhou, a tela segue sem o aviso, e repetir só multiplicaria o erro.
    retry: false,
  })
}

export function useMarcarPendenciasVistas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: marcarPendenciasVistas,
    // Só o aviso muda: as listas não dependem de "vista".
    onSuccess: () => qc.setQueryData(queryKeys.pendenciasNovas(), { pendencias: [] }),
  })
}
