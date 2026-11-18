// Hooks do Módulo 2 > Agenda de serviços (os postos de cada auditor, 0066).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryRoots } from '../lib/queryKeys'
import {
  desfazerPosto, encerrarPosto, fetchAgendaDoAuditor, fetchPostos, fetchServicosDosAuditores, lancarPosto, trocarPosto,
  type NovoPosto,
} from '../services/postos.service'

const LISTA_MS = 30_000

export function usePostos() {
  return useQuery({
    queryKey: queryKeys.postos(),
    queryFn: fetchPostos,
    staleTime: LISTA_MS,
    refetchOnWindowFocus: true,
  })
}

/** Os serviços de cada auditor, para a lista de Auditores (coluna Serviços). */
export function useServicosDosAuditores() {
  return useQuery({
    queryKey: queryKeys.postosServicos(),
    queryFn: fetchServicosDosAuditores,
    staleTime: LISTA_MS,
  })
}

/** A agenda de um auditor na ficha: serviços, produção do mês e hospitais. */
export function useAgendaDoAuditor(id: number) {
  return useQuery({
    queryKey: queryKeys.postosDoAuditor(id),
    queryFn: () => fetchAgendaDoAuditor(id),
    staleTime: LISTA_MS,
    enabled: id > 0,
  })
}

// O posto muda o que Fechamentos sugere (o médico e o enfermeiro do posto P) e a
// escala que Operações mostra: invalida as três raízes.
function useEscrita<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryRoots.postos })
      qc.invalidateQueries({ queryKey: queryRoots.fechamentos })
      qc.invalidateQueries({ queryKey: queryRoots.equipe })
    },
  })
}

export function useLancarPosto() {
  return useEscrita((body: NovoPosto) => lancarPosto(body))
}

export function useTrocarPosto() {
  return useEscrita((v: { id: number; profissional_id: number; a_partir_de: string; motivo: string | null }) =>
    trocarPosto(v.id, { profissional_id: v.profissional_id, a_partir_de: v.a_partir_de, motivo: v.motivo }))
}

export function useEncerrarPosto() {
  return useEscrita((v: { id: number; ultimo_dia: string; motivo: string | null }) =>
    encerrarPosto(v.id, { ultimo_dia: v.ultimo_dia, motivo: v.motivo }))
}

export function useDesfazerPosto() {
  return useEscrita((id: number) => desfazerPosto(id))
}
