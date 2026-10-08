// Serviço de dados do domínio "kanban" (quadro de tarefas do analista).
// Um único GET traz as colunas já separadas. Isola o contrato HTTP — a UI só
// fala com o hook.
import { apiFetch } from '../api/client'
import type { CensoTimeline, ConcluirAnalisePayload, KanbanPayload } from '../types/api'

/** Tarefas do kanban agrupadas por coluna. O quadro já vem recortado ao escopo de
 *  hospitais/operadoras do analista pelo backend — sem filtro manual. */
export function fetchKanban(): Promise<KanbanPayload> {
  return apiFetch<KanbanPayload>('/kanban')
}

/** O censo de UMA operadora num hospital: é a unidade do fluxo de censos. */
export interface CensoAlvo { hospitalKey: string; operadoraKey: string }

/** Movimento manual do card de censo: sempre com a anotação do que aconteceu
 *  ("Falei com a Maria da recepção"). O backend recusa sem ela (422). */
export interface MovimentoCenso extends CensoAlvo { anotacao: string }

const urlCenso = (a: CensoAlvo) => encodeURIComponent(a.hospitalKey)
const qsOperadora = (a: CensoAlvo) => new URLSearchParams({ operadora: a.operadoraKey }).toString()

function postCenso(m: MovimentoCenso, acao: string): Promise<{ ok: boolean }> {
  return apiFetch(`/kanban/censo/${urlCenso(m)}/${acao}?${qsOperadora(m)}`, {
    method: 'POST', body: { anotacao: m.anotacao },
  })
}

/** "Marcar como cobrado": o censo sai de "Censos atrasados" e vai para
 *  "Aguardando retorno". Cobra todos os dias em aberto de uma vez. */
export function marcarCobrado(m: MovimentoCenso): Promise<{ ok: boolean }> {
  return postCenso(m, 'cobrado')
}

/** Desfaz "Marcar como cobrado": o hospital volta para "Censos atrasados". */
export function desfazerCobranca(m: MovimentoCenso): Promise<{ ok: boolean }> {
  return postCenso(m, 'desfazer-cobranca')
}

/** "Marcar como atualizado": o hospital respondeu que não há censo novo a
 *  gerar. O censo vai de "Aguardando retorno" para "Censos atualizados". */
export function marcarAtualizado(m: MovimentoCenso): Promise<{ ok: boolean }> {
  return postCenso(m, 'atualizado')
}

/** Desfaz "Marcar como atualizado" de hoje. */
export function desfazerAtualizado(m: MovimentoCenso): Promise<{ ok: boolean }> {
  return postCenso(m, 'desfazer-atualizado')
}

/** Anotação avulsa no card, sem mover (ligou e ninguém atendeu). */
export function anotarCenso(m: MovimentoCenso): Promise<{ ok: boolean }> {
  return postCenso(m, 'anotacao')
}

/** Timeline do card de censo: anotações e censos recebidos nos últimos dias. */
export function fetchTimelineCenso(alvo: CensoAlvo): Promise<CensoTimeline> {
  return apiFetch<CensoTimeline>(`/kanban/censo/${urlCenso(alvo)}/timeline?${qsOperadora(alvo)}`)
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
