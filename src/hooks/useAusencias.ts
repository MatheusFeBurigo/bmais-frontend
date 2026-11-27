// Hooks das ausências dos auditores (pedidos de ausência, 0065), em Módulo 2 > Auditores desde 24/11/2026.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import { decidirAusencia, fetchAusencias } from '../services/ausencias.service'

const LISTA_MS = 30_000

/** `ativo` falso não busca (quem não vê as ausências, na tela de Auditores). */
export function useAusencias(ativo = true) {
  return useQuery({
    queryKey: queryKeys.ausencias(),
    queryFn: fetchAusencias,
    enabled: ativo,
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
