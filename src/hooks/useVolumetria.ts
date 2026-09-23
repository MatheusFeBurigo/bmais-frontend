// Hooks do painel de Volumetria (carga de trabalho por pessoa, coordenadores).
// Toda mutation invalida a query inteira: a carga de UMA pessoa depende de
// parâmetros e vínculos que afetam as outras, então recalcular tudo é o certo.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import type { VolumetriaParametrosCorpo } from '../types/api'
import {
  desvincularPessoa, fetchVolumetria, restaurarParametros, salvarParametros, vincularPessoa,
  type GrupoVolumetria,
} from '../services/volumetria.service'

export function useVolumetria() {
  return useQuery({
    queryKey: queryKeys.volumetria(),
    queryFn: fetchVolumetria,
    staleTime: 30_000,
  })
}

function useInvalidarVolumetria() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: queryKeys.volumetria() })
}

export function useVincularVolumetria() {
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: ({ hospitalKey, userId }: { hospitalKey: string; userId: string }) =>
      vincularPessoa(hospitalKey, userId),
    onSuccess: invalidar,
  })
}

export function useDesvincularVolumetria() {
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: ({ hospitalKey, userId }: { hospitalKey: string; userId: string }) =>
      desvincularPessoa(hospitalKey, userId),
    onSuccess: invalidar,
  })
}

export function useSalvarParametrosVolumetria() {
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: ({ grupo, corpo }: { grupo: GrupoVolumetria; corpo: VolumetriaParametrosCorpo }) =>
      salvarParametros(grupo, corpo),
    onSuccess: invalidar,
  })
}

export function useRestaurarParametrosVolumetria() {
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: (grupo: GrupoVolumetria) => restaurarParametros(grupo),
    onSuccess: invalidar,
  })
}
