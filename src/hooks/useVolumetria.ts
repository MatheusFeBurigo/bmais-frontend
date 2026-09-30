// Hooks do painel de Volumetria (carga de trabalho por pessoa, coordenadores).
// Toda mutation invalida a query inteira: a carga de UMA pessoa depende de
// parâmetros e vínculos que afetam as outras, então recalcular tudo é o certo.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import type { VolumetriaDividirCorpo, VolumetriaParametrosCorpo, VolumetriaPayload } from '../types/api'
import {
  cancelarDivisao, desvincularPessoa, dividirCarga, fetchVolumetria, restaurarParametros, salvarParametros, vincularPessoa,
  type GrupoVolumetria,
} from '../services/volumetria.service'
import { aplicarDivisao } from '../components/volumetria/volumetria.model'

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

/** Otimista: o hospital sai de "sem cobertura" e soma no cartão da pessoa na
 *  hora. Esperar o refetch deixava a linha parada por segundos (o payload
 *  recalcula a fila da rede inteira). O refetch continua, para acertar horas,
 *  nível e regiões, que dependem de conta que só o backend faz. */
function atribuirNoCache(
  dados: VolumetriaPayload, hospitalKey: string, userId: string,
): VolumetriaPayload {
  return {
    ...dados,
    grupos: dados.grupos.map((g) => {
      const hosp = g.sem_cobertura.find((h) => h.hospital_key === hospitalKey)
      if (!hosp || !g.pessoas.some((p) => p.user_id === userId)) return g
      return {
        ...g,
        sem_cobertura: g.sem_cobertura.filter((h) => h.hospital_key !== hospitalKey),
        pessoas: g.pessoas.map((p) => p.user_id !== userId ? p : {
          ...p,
          hospitais_n: p.hospitais_n + 1,
          total_pendencias: (p.total_pendencias ?? 0) + hosp.pendencias,
        }),
      }
    }),
  }
}

export function useVincularVolumetria() {
  const qc = useQueryClient()
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: ({ hospitalKey, userId }: { hospitalKey: string; userId: string }) =>
      vincularPessoa(hospitalKey, userId),
    onMutate: async ({ hospitalKey, userId }) => {
      // Um refetch em voo traria o retrato de antes e desfaria a mudança.
      await qc.cancelQueries({ queryKey: queryKeys.volumetria() })
      const antes = qc.getQueryData<VolumetriaPayload>(queryKeys.volumetria())
      if (antes) qc.setQueryData(queryKeys.volumetria(), atribuirNoCache(antes, hospitalKey, userId))
      return { antes }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.antes) qc.setQueryData(queryKeys.volumetria(), ctx.antes)
    },
    onSettled: invalidar,
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

/** Otimista pelo mesmo motivo do vínculo: a tela mostra a carga já dividida no
 *  clique, e o refetch depois acerta o que só o backend calcula (pressão). */
export function useDividirCarga() {
  const qc = useQueryClient()
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: (corpo: VolumetriaDividirCorpo) => dividirCarga(corpo),
    onMutate: async (corpo) => {
      await qc.cancelQueries({ queryKey: queryKeys.volumetria() })
      const antes = qc.getQueryData<VolumetriaPayload>(queryKeys.volumetria())
      if (antes) {
        qc.setQueryData<VolumetriaPayload>(queryKeys.volumetria(), {
          ...antes,
          grupos: antes.grupos.map((g) => aplicarDivisao(g, corpo)),
        })
      }
      return { antes }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.antes) qc.setQueryData(queryKeys.volumetria(), ctx.antes)
    },
    onSettled: invalidar,
  })
}

export function useCancelarDivisao() {
  const invalidar = useInvalidarVolumetria()
  return useMutation({
    mutationFn: (lote: string) => cancelarDivisao(lote),
    onSuccess: invalidar,
  })
}
