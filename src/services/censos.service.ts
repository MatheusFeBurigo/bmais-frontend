// Serviço de upload de censos. Encapsula a montagem do FormData e as chamadas
// HTTP — a tela passa apenas os arquivos e, depois, os dados que o usuário
// completou para cada paciente que o parser não conseguiu validar.
import { apiFetch, apiUpload } from '../api/client'
import type {
  CompletarPendenciaPayload, CompletarPendenciaResponse, HospitalManual, UploadCensoResponse,
} from '../types/api'

function formDe(files: File[]): FormData {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  return fd
}

// Resposta da fase 1 (stage): só confirma o recebimento dos arquivos.
interface StageResponse { sessao: string; arquivos: string[] }

/** Processa PDFs de censo hospitalar em 2 fases, para não estourar o timeout.
 *
 *  Fase 1 (stage): sobe os arquivos e recebe OK imediato (rápido, só I/O).
 *  Fase 2 (processar): dispara automaticamente e importa a sessão no banco (lento).
 *  Separar as duas evita o timeout do cliente em lotes grandes: o upload em si
 *  responde rápido; o processamento pesado roda numa chamada dedicada.
 *  Cada resultado traz `pendentes_detalhe`: pacientes cuja extração ficou
 *  incompleta, para o usuário completar via `completarPendenciaCenso`.
 *
 *  `hospitais` (opcional) mapeia nome-do-arquivo → hospital escolhido pelo usuário
 *  na tela de envio. Vai junto no processamento, então o backend já lê cada PDF
 *  sabendo de qual hospital ele é: usa o leitor dedicado daquele hospital quando
 *  existe, e não precisa perguntar depois. Arquivo fora do mapa segue automático. */
export async function enviarCensos(
  files: File[], hospitais?: Record<string, HospitalManual>,
): Promise<UploadCensoResponse> {
  const stage = await apiUpload<StageResponse>('/upload/stage', formDe(files))
  return apiFetch<UploadCensoResponse>('/upload/processar', {
    method: 'POST',
    body: hospitais && Object.keys(hospitais).length
      ? { sessao: stage.sessao, hospitais }
      : { sessao: stage.sessao },
    timeoutMs: 120_000,
  })
}

/** Reprocessa arquivos de uma sessão já enviada (assistente): só os listados, com o
 *  hospital informado pelo usuário para os que o PDF não trouxe no cadastro. Devolve
 *  o mesmo formato do processamento (um resultado por arquivo reprocessado). */
export function reprocessarCensos(
  sessao: string, arquivos: string[], hospitais: Record<string, HospitalManual>,
): Promise<UploadCensoResponse> {
  return apiFetch<UploadCensoResponse>('/upload/processar', {
    method: 'POST',
    body: { sessao, arquivos, hospitais },
    timeoutMs: 120_000,
  })
}

/** Processa arquivos que o backend recusou por JÁ TEREM SIDO LIDOS antes, depois
 *  de o usuário confirmar. Os arquivos continuam no staging da sessão, então é a
 *  mesma rota — o que muda é `confirmados`, que autoriza nominalmente cada um. */
export function confirmarReenvioCensos(
  sessao: string, arquivos: string[], hospitais?: Record<string, HospitalManual>,
): Promise<UploadCensoResponse> {
  return apiFetch<UploadCensoResponse>('/upload/processar', {
    method: 'POST',
    body: {
      sessao, arquivos, confirmados: arquivos,
      ...(hospitais && Object.keys(hospitais).length ? { hospitais } : {}),
    },
    timeoutMs: 120_000,
  })
}

/** Descarta uma pendência de censo: resolve SEM gravar o paciente. A revisão é
 *  toda feita no upload — não há fila no Kanban para resgatar o que ficasse aberto,
 *  então o assistente precisa desta saída explícita para o registro que não entra. */
export function descartarPendenciaCenso(pendenciaId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/upload/pendencia/${pendenciaId}/descartar`, { method: 'POST' })
}

/** Fase 3: grava um paciente cuja extração ficou incompleta, com os campos que o
 *  usuário informou. `ok=false` (HTTP 200) = ainda falta algo — a resposta diz o quê;
 *  404/409 = pendência inexistente / já tratada (viram exceção). */
export function completarPendenciaCenso(
  pendenciaId: number, payload: CompletarPendenciaPayload,
): Promise<CompletarPendenciaResponse> {
  return apiFetch<CompletarPendenciaResponse>(
    `/upload/pendencia/${pendenciaId}/completar`, { method: 'POST', body: payload },
  )
}

/** Um envio de censo já processado (agrupado por sessão) — a lista do desfazer. */
export interface EnvioCenso {
  sessao: string
  hospital_key?: string | null
  hospital_nome?: string | null
  processado_em?: string | null
  arquivos: string[]
  total_pacientes: number
  revertido_em?: string | null
}

/** Resultado de desfazer um envio. `pacientes` são os que foram REMOVIDOS. */
export interface ReverterEnvioResposta {
  ok: boolean
  sessao: string
  removidos: number
  pacientes: Array<{ id: number; nome?: string | null; atendimento?: string | null }>
  pendencias_resolvidas: number
  hospital_nome?: string | null
}

/** Envios de censo recentes, já recortados ao escopo de hospitais do usuário. */
export function fetchEnviosCenso(): Promise<{ envios: EnvioCenso[] }> {
  return apiFetch('/upload/envios')
}

/** Desfaz um envio: apaga os pacientes que ELE criou (censo no hospital errado).
 *  O que já existia e foi só atualizado permanece — o backend não tem o valor
 *  anterior para restaurar, e apagar destruiria dado anterior ao envio. */
export function reverterEnvioCenso(sessao: string): Promise<ReverterEnvioResposta> {
  return apiFetch(`/upload/envios/${encodeURIComponent(sessao)}/reverter`, { method: 'POST' })
}
