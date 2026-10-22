// Pendências avulsas da equipe: leitura e as três ações. Toda ação recompõe as
// listas de pendências (por prefixo) e a Distribuição, que conta as abertas.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  concluirPendencia, criarPendencia, excluirPendencia, fetchEquipePendencias,
  fetchMinhasPendencias, fetchPendenciasDaPessoa,
} from '../services/pendencias.service'
import type { NovaPendencia } from '../types/api'

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
