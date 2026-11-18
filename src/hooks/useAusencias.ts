// Hooks do Módulo 2 > Ausências (pedidos de ausência dos auditores, 0065).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import { decidirAusencia, fetchAusencias } from '../services/ausencias.service'

const LISTA_MS = 30_000

export function useAusencias() {
  return useQuery({
    queryKey: queryKeys.ausencias(),
    queryFn: fetchAusencias,
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

// Aprovar muda os fechamentos do dia (viram troca pedida): invalida as duas raízes.
export function useDecidirAusencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: number; aprovar: boolean; motivo?: string }) =>
      decidirAusencia(v.id, { aprovar: v.aprovar, ...(v.motivo ? { motivo: v.motivo } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryRoots.ausencias })
      qc.invalidateQueries({ queryKey: queryRoots.fechamentos })
    },
  })
}
