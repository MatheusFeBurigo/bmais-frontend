// Serviço de upload de censos e relatórios em lote. Encapsula a montagem do
// FormData e o apiUpload — a tela passa apenas os arquivos.
import { apiFetch, apiUpload } from '../api/client'
import type {
  UploadCensoResponse, RelatorioLoteResponse, RelatorioRefreshResponse,
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

/** Processa DOCX/PDF de relatórios em lote; autoApply casa matches ≥ 0.70. */
export function enviarRelatorios(files: File[], autoApply: boolean): Promise<RelatorioLoteResponse> {
  return apiUpload<RelatorioLoteResponse>(
    '/relatorios/upload',
    formDe(files, { auto_apply: autoApply ? 'true' : 'false' }),
  )
}

/** Reprocessa a pasta de relatórios do servidor (sem upload de arquivos). */
export function reprocessarPastaRelatorios(): Promise<RelatorioRefreshResponse> {
  return apiUpload<RelatorioRefreshResponse>('/relatorios/refresh', new FormData())
}
