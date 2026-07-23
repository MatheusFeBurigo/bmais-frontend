// Serviço de dados do domínio "kanban" (quadro de tarefas do analista).
// Um único GET traz as três colunas já separadas; resolver marca uma pendência
// de parsing como tratada. Isola o contrato HTTP — a UI só fala com o hook.
import { apiFetch } from '../api/client'
import type { KanbanPayload, InternacaoBusca, ConcluirAnalisePayload } from '../types/api'

/** Tarefas do kanban agrupadas por coluna. O quadro já vem recortado ao escopo de
 *  hospitais/operadoras do analista pelo backend — sem filtro manual. */
export function fetchKanban(): Promise<KanbanPayload> {
  return apiFetch<KanbanPayload>('/kanban')
}

/** Marca uma pendência de parsing (coluna "refazer análise") como resolvida. */
export function resolverPendencia(pendenciaId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/kanban/pendencia/${pendenciaId}/resolver`, { method: 'POST' })
}

/** Marca uma cobrança de censo (coluna "Cobrar censo") como cobrada. */
export function marcarCobrado(cobrancaId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/kanban/cobranca/${cobrancaId}/cobrado`, { method: 'POST' })
}

/** Conclui uma análise técnica: grava o parecer interno (2º relatório) e fecha a tarefa. */
export function concluirAnalise(
  analiseId: number, payload: ConcluirAnalisePayload,
): Promise<{ ok: boolean; internacao_id: number }> {
  return apiFetch(`/kanban/analise/${analiseId}/concluir`, { method: 'POST', body: payload })
}

/** URL assinada temporária do PDF de origem da pendência (ou null se não houver). */
export function urlPdfPendencia(pendenciaId: number): Promise<{ url: string | null }> {
  return apiFetch(`/kanban/pendencia/${pendenciaId}/pdf`)
}

/** URL assinada temporária do documento de um relatório (auditor externo). Baixar/abrir
 *  direto dessa URL evita o redirect cross-origin que corrompe o download. `nome` traz
 *  a extensão real do arquivo (.docx/.pdf/…) — o cliente não deve fixar uma extensão. */
export function urlArquivoRelatorio(
  relatorioId: number,
): Promise<{ url: string | null; nome: string | null }> {
  return apiFetch(`/relatorio/${relatorioId}/arquivo-url`)
}

/** Busca internações por nome (seletor de encaixe): o analista digita e escolhe o
 *  paciente compatível. Já recortado ao escopo do usuário pelo backend. */
export function buscarInternacoes(termo: string): Promise<{ itens: InternacaoBusca[] }> {
  return apiFetch(`/internacoes/buscar?q=${encodeURIComponent(termo)}`)
}
