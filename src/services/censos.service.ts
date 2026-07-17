// Serviço de upload de censos e relatórios em lote. Encapsula a montagem do
// FormData e o apiUpload — a tela passa apenas os arquivos.
import { apiUpload } from '../api/client'
import type {
  UploadCensoResponse, RelatorioLoteResponse, RelatorioRefreshResponse,
} from '../types/api'

function formDe(files: File[], extra?: Record<string, string>): FormData {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v)
  return fd
}

/** Processa PDFs de censo hospitalar. */
export function enviarCensos(files: File[]): Promise<UploadCensoResponse> {
  return apiUpload<UploadCensoResponse>('/upload', formDe(files))
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
