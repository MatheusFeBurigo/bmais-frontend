// Serviço de dados do domínio "kanban" (quadro de tarefas do analista).
// Um único GET traz as colunas já separadas. Isola o contrato HTTP — a UI só
// fala com o hook.
import { apiFetch } from '../api/client'
import type { KanbanPayload, ConcluirAnalisePayload } from '../types/api'

/** Tarefas do kanban agrupadas por coluna. O quadro já vem recortado ao escopo de
 *  hospitais/operadoras do analista pelo backend — sem filtro manual. */
export function fetchKanban(): Promise<KanbanPayload> {
  return apiFetch<KanbanPayload>('/kanban')
}

/** O censo de UMA operadora num hospital: é a unidade do fluxo de censos. */
export interface CensoAlvo { hospitalKey: string; operadoraKey: string }

const urlCenso = (a: CensoAlvo) => encodeURIComponent(a.hospitalKey)
const qsOperadora = (a: CensoAlvo) => new URLSearchParams({ operadora: a.operadoraKey }).toString()

/** "Marcar como cobrado": o censo sai de "Censos atrasados" e vai para
 *  "Aguardando retorno". Cobra todos os dias em aberto de uma vez. */
export function marcarCobrado(alvo: CensoAlvo): Promise<{ ok: boolean }> {
  return apiFetch(`/kanban/censo/${urlCenso(alvo)}/cobrado?${qsOperadora(alvo)}`, { method: 'POST' })
}

/** Desfaz "Marcar como cobrado": o hospital volta para "Censos atrasados". */
export function desfazerCobranca(alvo: CensoAlvo): Promise<{ ok: boolean }> {
  return apiFetch(`/kanban/censo/${urlCenso(alvo)}/desfazer-cobranca?${qsOperadora(alvo)}`, { method: 'POST' })
}

/** Conclui uma análise técnica: grava o parecer interno (2º relatório) e fecha a tarefa. */
export function concluirAnalise(
  analiseId: number, payload: ConcluirAnalisePayload,
): Promise<{ ok: boolean; internacao_id: number }> {
  return apiFetch(`/kanban/analise/${analiseId}/concluir`, { method: 'POST', body: payload })
}

/** URL assinada temporária do documento de um relatório (auditor externo). Baixar/abrir
 *  direto dessa URL evita o redirect cross-origin que corrompe o download. `nome` traz
 *  a extensão real do arquivo (.docx/.pdf/…) — o cliente não deve fixar uma extensão. */
export function urlArquivoRelatorio(
  relatorioId: number,
): Promise<{ url: string | null; nome: string | null }> {
  return apiFetch(`/relatorio/${relatorioId}/arquivo-url`)
}
