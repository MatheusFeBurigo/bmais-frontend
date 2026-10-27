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
import { fetchEnviosCenso, reverterEnvioCenso } from '../services/censos.service'
import { atualizarUsuario } from '../services/usuarios.service'

// Quantos envios Movimentações consulta: o mesmo alcance do desfazer no backend
// (`reverter_envio`), que não acha um envio além disso.
const ENVIOS_ALCANCE = 200

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

/** Envios de censo recentes (com o estado de cada arquivo): diz, para cada
 *  registro de "Censo processado", se o lote ainda pode ser desfeito. Só para
 *  quem envia censo (o analista lê a trilha, mas não desfaz). */
export function useEnviosCenso(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.enviosCenso(ENVIOS_ALCANCE),
    queryFn: () => fetchEnviosCenso(ENVIOS_ALCANCE),
    ...opcoesAutoRefresh,
    enabled,
  })
}

/** Desfaz um lote (um arquivo de um envio de censo): apaga os pacientes que ele
 *  criou. Recompõe os painéis, a trilha e a lista de envios. */
export function useDesfazerLote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessao, arquivo }: { sessao: string; arquivo: string }) =>
      reverterEnvioCenso(sessao, arquivo),
    onSuccess: () => invalidarPorEvento(qc, 'loteDesfeito'),
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
