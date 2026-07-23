// Serviço de upload de censos e relatórios em lote. Encapsula a montagem do
// FormData e o apiUpload — a tela passa apenas os arquivos.
import { apiFetch, apiUpload } from '../api/client'
import type {
  UploadCensoResponse, RelatorioLoteResponse, RelatorioRefreshResponse,
  ConfirmarEncaixePayload, CriarEncaixePayload,
} from '../types/api'

function formDe(files: File[], extra?: Record<string, string>): FormData {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v)
  return fd
}

// Resposta da fase 1 (stage): só confirma o recebimento dos arquivos.
interface StageResponse { sessao: string; arquivos: string[] }

/** Processa PDFs de censo hospitalar em 2 fases, para não estourar o timeout.
 *
 *  Fase 1 (stage): sobe os arquivos e recebe OK imediato (rápido, só I/O).
 *  Fase 2 (processar): dispara automaticamente e importa a sessão no banco (lento).
 *  Separar as duas evita o timeout do cliente em lotes grandes: o upload em si
 *  responde rápido; o processamento pesado roda numa chamada dedicada. */
export async function enviarCensos(files: File[]): Promise<UploadCensoResponse> {
  const stage = await apiUpload<StageResponse>('/upload/stage', formDe(files))
  return apiFetch<UploadCensoResponse>('/upload/processar', {
    method: 'POST',
    body: { sessao: stage.sessao },
    timeoutMs: 120_000,
  })
}

/** Lê DOCX/PDF de relatórios em lote e envia cada paciente para REVISÃO HUMANA.
 *  Nada é aplicado automaticamente — o encaixe é confirmado na tela de revisão. */
export function enviarRelatorios(files: File[]): Promise<RelatorioLoteResponse> {
  return apiUpload<RelatorioLoteResponse>('/relatorios/upload', formDe(files))
}

/** Reprocessa a pasta de relatórios do servidor (sem upload de arquivos). */
export function reprocessarPastaRelatorios(): Promise<RelatorioRefreshResponse> {
  return apiUpload<RelatorioRefreshResponse>('/relatorios/refresh', new FormData())
}

// ── Encaixe de relatórios (cards da coluna "Revisão Relatório" no Kanban) ─────
// A listagem vem embutida no payload do Kanban (coluna revisao_relatorio); aqui
// ficam só as ações de confirmar/descartar o encaixe de cada card.

/** Confirma o encaixe de um relatório numa internação (grava + resolve a pendência). */
export function confirmarEncaixeRelatorio(
  pendenciaId: number, payload: ConfirmarEncaixePayload,
): Promise<{ ok: boolean }> {
  return apiFetch(`/relatorios/revisao/${pendenciaId}/confirmar`, { method: 'POST', body: payload })
}

/** Descarta uma entrada de relatório sem gravá-la (falso positivo / não aplicável). */
export function descartarRevisaoRelatorio(pendenciaId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/relatorios/revisao/${pendenciaId}/descartar`, { method: 'POST', body: {} })
}

/** Cria a internação de um paciente não vinculado e encaixa o relatório nela (um passo).
 *  `ja_existia=true` quando o (hospital, atendimento) já existia: encaixou no existente. */
export function criarEncaixarRelatorio(
  pendenciaId: number, payload: CriarEncaixePayload,
): Promise<{ ok: boolean; internacao_id: number; ja_existia?: boolean }> {
  return apiFetch(`/relatorios/revisao/${pendenciaId}/criar-encaixar`, { method: 'POST', body: payload })
}
