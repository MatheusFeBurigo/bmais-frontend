// Hooks de estado de servidor do domínio "auditoria" (tela de Movimentações).
//
// A trilha muda por fora desta aba o tempo todo (outros usuários agindo), então
// as listas seguem a mesma política de revalidação automática da Visão Geral
// (polling com a aba visível + foco/reconexão — lib/autoRefresh).
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import { invalidarPorEvento } from '../lib/invalidation'
import {
  fetchAuditoria, fetchAuditoriaOpcoes, fetchAuditoriaResumo, type AuditoriaParams,
} from '../services/auditoria.service'
import { atualizarUsuario } from '../services/usuarios.service'

export function useAuditoria(params: AuditoriaParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditoria(
      params.userId ?? '', params.entidade ?? '', params.acao ?? '',
      params.de ?? '', params.ate ?? '', params.q ?? '', params.pagina ?? 0, params.limite ?? 50,
    ),
    queryFn: () => fetchAuditoria(params),
    // Ao mudar filtro/página, mantém a lista anterior em tela até a nova chegar
    // (sem "piscar" para vazio).
    placeholderData: keepPreviousData,
    ...opcoesAutoRefresh,
    enabled,
  })
}

/** Catálogo de entidades/ações — estático por deploy, cache longo. */
export function useAuditoriaOpcoes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditoriaOpcoes(),
    queryFn: fetchAuditoriaOpcoes,
    staleTime: 60 * 60_000,
    enabled,
  })
}

export function useAuditoriaResumo(de: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditoriaResumo(de),
    queryFn: () => fetchAuditoriaResumo(de || undefined),
    placeholderData: keepPreviousData,
    ...opcoesAutoRefresh,
    enabled,
  })
}

/** Suspender/reativar uma conta (PATCH ativo). Conta suspensa recebe 403 em toda a
 *  API sem ser apagada — reversível. Invalida usuários + trilha ao concluir. */
export function useDefinirAtivoUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ativo }: { userId: string; ativo: boolean }) =>
      atualizarUsuario(userId, { ativo }),
    onSuccess: () => invalidarPorEvento(qc, 'usuariosAlterados'),
  })
}
