// Hook de estado de servidor do domínio "kanban" (tarefas do analista).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { opcoesAutoRefresh } from '../lib/autoRefresh'
import { queryKeys } from '../lib/queryKeys'
import {
  desfazerAtualizado, desfazerCobranca, fetchKanban, marcarAtualizado, marcarCobrado, type CensoAlvo,
} from '../services/kanban.service'
import {
  aprovarRelatorio, devolverRelatorio, fetchCatalogosProrrogacao, pausarProrrogacao, reenviarRelatorio,
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
    mutationFn: (alvo: CensoAlvo) => marcarCobrado(alvo),
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
    mutationFn: (alvo: CensoAlvo) => desfazerCobranca(alvo),
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
    mutationFn: (alvo: CensoAlvo) => marcarAtualizado(alvo),
    onSuccess: (_res, alvo) => {
      qc.setQueryData<KanbanPayload>(queryKeys.kanban(), (atual) => moverCenso(
        atual, alvo, 'aguardando_retorno', 'censos_processados',
        { atualizado_em: new Date().toISOString() }))
      qc.invalidateQueries({ queryKey: queryKeys.kanban() })
    },
  })
}

// Desfazer o "atualizado": o card volta para onde estava (o backend decide).
export function useDesfazerAtualizado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alvo: CensoAlvo) => desfazerAtualizado(alvo),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kanban() }),
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

// Pausar/retomar muda o card da coluna "Em prorrogação" e a ficha do paciente.
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
