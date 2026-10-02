// Hook de estado de servidor do domínio "internação".
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import {
  criarConvenio,
  desvincularPessoa,
  editarInternacao,
  fetchInternacaoDados,
  listarConvenios,
  fetchInternacaoRelatorios,
  fetchInternacaoTimeline,
  fetchSugestoesPessoa,
  registrarRelatorioRapido,
  responderSugestaoPessoa,
  type InternacaoEdicao,
  type RelatorioRapido,
} from '../services/internacao.service'

// Reabrir o mesmo paciente (ou um já pré-carregado no hover) não deve refazer a
// busca: mantém fresco por 1min.
const DRAWER_STALE = 60_000

export function useInternacaoDados(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoDados(id),
    queryFn: () => fetchInternacaoDados(id),
    staleTime: DRAWER_STALE,
  })
}

export function useInternacaoTimeline(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoTimeline(id),
    queryFn: () => fetchInternacaoTimeline(id),
    staleTime: DRAWER_STALE,
  })
}

export function useInternacaoRelatorios(id: number) {
  return useQuery({
    queryKey: queryKeys.internacaoRelatorios(id),
    queryFn: () => fetchInternacaoRelatorios(id),
    staleTime: DRAWER_STALE,
  })
}

// ── Ficha do paciente: a mesma pessoa em várias internações (0049) ──────────

export function useSugestoesPessoa(id: number, habilitado = true) {
  return useQuery({
    queryKey: queryKeys.sugestoesPessoa(id),
    queryFn: () => fetchSugestoesPessoa(id),
    staleTime: DRAWER_STALE,
    enabled: habilitado,
  })
}

// Confirmar, recusar ou desligar muda a história contada na timeline: as duas
// leituras são refeitas. A timeline da OUTRA internação também muda, mas ela só
// é lida quando alguém a abre, e o staleTime curto cobre esse caso.
function useInvalidarFicha(id: number) {
  const qc = useQueryClient()
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(id) })
    qc.invalidateQueries({ queryKey: queryKeys.sugestoesPessoa(id) })
  }, [qc, id])
}

export function useResponderSugestaoPessoa(id: number) {
  const invalidar = useInvalidarFicha(id)
  return useMutation({
    mutationFn: ({ sugestaoId, confirmar }: { sugestaoId: number; confirmar: boolean }) =>
      responderSugestaoPessoa(id, sugestaoId, confirmar),
    onSuccess: invalidar,
  })
}

export function useDesvincularPessoa(id: number) {
  const invalidar = useInvalidarFicha(id)
  return useMutation({
    mutationFn: (outraId: number) => desvincularPessoa(id, outraId),
    onSuccess: invalidar,
  })
}

// Edição dos dados da internação. Ao concluir, invalida dados + timeline: a
// própria edição gera um evento EDIT que precisa aparecer na timeline, e os
// KPIs derivados (status_relatorio etc.) podem mudar conforme os campos alterados.
export function useEditarInternacao(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mudancas: InternacaoEdicao) => editarInternacao(id, mudancas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(id) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(id) })
    },
  })
}

// Registro de relatório de visita, usado pela ficha e pelo drawer. Atualiza o
// card de relatórios, a timeline e os dados deste paciente; e como o relatório
// muda o status_relatorio, o evento de domínio recompõe Kanban e agregados por
// status (Dashboard/Diretoria/Gestor/Sidebar).
export function useRegistrarRelatorio(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rel: RelatorioRapido) => registrarRelatorioRapido(id, rel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.internacaoRelatorios(id) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(id) })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(id) })
      invalidarPorEvento(qc, 'relatorioAdicionado')
    },
  })
}

// Prefetch em background: dispara dados + timeline ANTES do clique (ex.: no hover
// da linha). Quando o usuário abre o drawer, os dados já estão no cache do
// react-query e ele renderiza instantâneo. Idempotente e barato (prefetchQuery
// não refaz se já está fresco).
export function usePrefetchInternacao() {
  const qc = useQueryClient()
  return useCallback((id: number) => {
    qc.prefetchQuery({
      queryKey: queryKeys.internacaoDados(id),
      queryFn: () => fetchInternacaoDados(id),
      staleTime: DRAWER_STALE,
    })
    qc.prefetchQuery({
      queryKey: queryKeys.internacaoTimeline(id),
      queryFn: () => fetchInternacaoTimeline(id),
      staleTime: DRAWER_STALE,
    })
  }, [qc])
}

/** Convênios já vistos nos censos, para o dropdown da conferência do envio.
 *
 *  `enabled` por parâmetro: a lista varre o histórico de internações, e a modal
 *  de edição é aberta por poucos pacientes num envio. Buscar junto com a tela
 *  faria todo upload pagar por um dado que a maioria dos envios não abre.
 *
 *  `staleTime` alto porque o conjunto de convênios praticamente não muda dentro
 *  de uma sessão: um convênio novo só aparece quando entra um censo com um nome
 *  inédito, e aí o envio seguinte já o traz (o backend esvazia o cache a cada
 *  escrita).
 */
export function useConvenios(ativo: boolean) {
  return useQuery({
    queryKey: queryKeys.convenios(),
    queryFn: listarConvenios,
    enabled: ativo,
    staleTime: 10 * 60 * 1000,
  })
}

/** Cadastra um convênio novo (diretor/admin) e recarrega a lista.
 *
 *  A invalidação é o ponto: sem ela o `staleTime` de 10min do `useConvenios`
 *  seguraria a lista antiga, e o convênio recém-criado não apareceria no
 *  combobox que acabou de criá-lo. */
export function useCriarConvenio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ nome, operadoraKey }: { nome: string; operadoraKey: string }) =>
      criarConvenio(nome, operadoraKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.convenios() })
    },
  })
}
