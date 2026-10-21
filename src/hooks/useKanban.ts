// Hook de estado de servidor do domínio "kanban" (tarefas do analista).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import { queryKeys } from '../lib/queryKeys'
import {
  anotarCenso, decidirDesfazerCenso, desfazerAtualizado, desfazerCobranca, fetchKanban,
  fetchPedidosDesfazerCenso, fetchTimelineCenso, marcarAtualizado, marcarCobrado,
  type CensoAlvo, type MovimentoCenso,
} from '../services/kanban.service'
import {
  aprovarRelatorio, devolverRelatorio, editarEAprovarRelatorio, fetchCatalogosProrrogacao,
  pausarProrrogacao, reenviarRelatorio, type RelatorioRapido,
} from '../services/internacao.service'
import { invalidarPorEvento } from '../lib/invalidation'
import type { EstadoCenso, KanbanPayload, KanbanTarefa } from '../types/api'

// O quadro reflete pendências, status de relatório e o fluxo de censos: dado que
// muda ao importar censos ou registrar relatórios. O envio feito NESTA aba já
// invalida o quadro (evento dadosAlterados); o polling cobre o censo que chega
// por outra pessoa ou outra aba, para o card andar de coluna sem F5.
export function useKanban() {
  return useQuery({
    queryKey: queryKeys.kanban(),
    queryFn: fetchKanban,
    ...opcoesAutoRefresh,
  })
}

// Move o card de um hospital entre duas colunas de censo no cache, na hora
// (otimista). O invalidate logo depois traz a coluna de verdade do backend.
function moverCenso(
  atual: KanbanPayload | undefined, alvo: CensoAlvo,
  de: EstadoCenso, para: EstadoCenso, extra: Partial<KanbanTarefa>,
): KanbanPayload | undefined {
  if (!atual?.tarefas) return atual
  const origem = atual.tarefas[de] ?? []
  // Hospital E operadora: o mesmo hospital tem um card por operadora.
  const eh = (t: KanbanTarefa) =>
    t.hospital_key === alvo.hospitalKey && (t.operadora_key ?? '') === alvo.operadoraKey
  const card = origem.find(eh)
  if (!card) return atual
  return {
    ...atual,
    tarefas: {
      ...atual.tarefas,
      [de]: origem.filter((t) => !eh(t)),
      [para]: [...(atual.tarefas[para] ?? []), { ...card, ...extra, coluna: para, estado_censo: para }],
    },
  }
}

// Marcar cobrado: "Censos atrasados" → "Aguardando retorno".
export function useMarcarCobrado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (m: MovimentoCenso) => marcarCobrado(m),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'censos_atrasados', 'aguardando_retorno',
        { cobrado_em: new Date().toISOString() }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}

// Desfazer: "Aguardando retorno" → "Censos atrasados", sem autor da cobrança.
export function useDesfazerCobranca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (m: MovimentoCenso) => desfazerCobranca(m),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'aguardando_retorno', 'censos_atrasados',
        { cobrado_em: null, cobrado_por: null }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}

// Marcar atualizado: "Aguardando retorno" → "Censos atualizados", sem censo novo.
export function useMarcarAtualizado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (m: MovimentoCenso) => marcarAtualizado(m),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'aguardando_retorno', 'censos_processados',
        { atualizado_em: new Date().toISOString() }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}

// Desfazer o "atualizado", sem anotação: quem aprova desfaz e o card volta
// para onde estava (o backend decide); os demais só abrem o pedido.
export function useDesfazerAtualizado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (a: CensoAlvo) => desfazerAtualizado(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kanban() }),
  })
}

// Pedidos para desfazer a atualização (Distribuição de tarefas). Com polling:
// o pedido nasce na tela de outra pessoa.
export function usePedidosDesfazerCenso() {
  return useQuery({
    queryKey: queryKeys.pedidosDesfazerCenso(),
    queryFn: fetchPedidosDesfazerCenso,
    ...opcoesAutoRefresh,
  })
}

// Aprovar move o card e pode mudar a carga do operacional (o censo volta a
// ser pendente): renova o quadro, a lista e a Distribuição.
export function useDecidirDesfazerCenso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ aprovar, ...alvo }: CensoAlvo & { aprovar: boolean }) =>
      decidirDesfazerCenso(alvo, aprovar),
    onSuccess: (_r, { aprovar }) => {
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
      if (aprovar) qc.invalidateQueries({ queryKey: queryKeys.volumetria() })
    },
  })
}

// Anotação avulsa no card de censo: não move nada, só renova a timeline dele.
export function useAnotarCenso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (m: MovimentoCenso) => anotarCenso(m),
    onSuccess: (_r, m) => qc.invalidateQueries({
      queryKey: queryKeys.censoTimeline(m.hospitalKey, m.operadoraKey),
    }),
  })
}

// Timeline do card de censo, buscada só com o drawer aberto. Os movimentos
// invalidam ['kanban'] e, por prefixo, ela junto.
export function useTimelineCenso(alvo: CensoAlvo | null) {
  return useQuery({
    queryKey: queryKeys.censoTimeline(alvo?.hospitalKey ?? '', alvo?.operadoraKey ?? ''),
    queryFn: () => fetchTimelineCenso(alvo as CensoAlvo),
    enabled: alvo != null,
  })
}

// ── Aprovação de relatório (colunas do quadro de pacientes) ──────────────────
// Aprovar muda o status do paciente (o relatório passa a contar como visita), então
// recompõe tudo que conta status, como registrar um relatório. Devolver e reenviar
// só mexem na fila e na ficha. A ficha do paciente é invalidada pelo prefixo.
function aoMudarAprovacao(qc: ReturnType<typeof useQueryClient>, internacaoId: number | null | undefined) {
  invalidarPorEvento(qc, 'relatorioAdicionado')
  if (internacaoId != null) {
    qc.invalidateQueries({ queryKey: queryKeys.internacaoRelatorios(internacaoId) })
    qc.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(internacaoId) })
    qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
  }
}

export function useAprovarRelatorio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { relatorioId: number; internacaoId?: number | null }) => aprovarRelatorio(v.relatorioId),
    onSuccess: (_r, v) => aoMudarAprovacao(qc, v.internacaoId),
  })
}

export function useDevolverRelatorio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { relatorioId: number; motivo: string; internacaoId?: number | null }) =>
      devolverRelatorio(v.relatorioId, v.motivo),
    onSuccess: (_r, v) => aoMudarAprovacao(qc, v.internacaoId),
  })
}

/** Quem aprova corrige o relatório pendente e o aprova no mesmo passo. */
export function useEditarAprovarRelatorio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      relatorioId: number; internacaoId?: number | null
      rel: RelatorioRapido & { remover_anexo?: boolean }; arquivo?: File | null
    }) => editarEAprovarRelatorio(v.relatorioId, v.rel, v.arquivo),
    onSuccess: (_r, v) => aoMudarAprovacao(qc, v.internacaoId),
  })
}

export function useReenviarRelatorio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      relatorioId: number; internacaoId?: number | null
      data_visita: string; medico: string; descricao: string
    }) => reenviarRelatorio(v.relatorioId, {
      data_visita: v.data_visita, medico: v.medico, descricao: v.descricao,
    }),
    onSuccess: (_r, v) => aoMudarAprovacao(qc, v.internacaoId),
  })
}

// ── Prorrogação ───────────────────────────────────────────────────────────────
// Catálogos estáticos (acomodação e justificativa): uma busca por sessão. Vazio
// (banco sem a migration) não fica guardado: a próxima abertura busca de novo.
export function useCatalogosProrrogacao(ativo = true) {
  return useQuery({
    queryKey: queryKeys.prorrogacaoCatalogos(),
    queryFn: fetchCatalogosProrrogacao,
    staleTime: (q) => (q.state.data?.acomodacoes.length ? Infinity : 0),
    enabled: ativo,
  })
}

// Pausar/retomar muda a etiqueta do card em Tarefas e a ficha do paciente.
export function usePausarProrrogacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { internacaoId: number; pausada: boolean }) => pausarProrrogacao(v.internacaoId, v.pausada),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
      qc.invalidateQueries({ queryKey: queryKeys.internacaoDados(v.internacaoId) })
    },
  })
}
