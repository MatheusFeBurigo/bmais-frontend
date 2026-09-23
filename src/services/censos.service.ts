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

/** Quanto do envio já foi feito, para a tela mostrar a porcentagem.
 *
 *  `fracao` (0..1) é o progresso CONTÍNUO do lote inteiro, já somando as duas
 *  fases. Contar só arquivos inteiros dava uma barra de dois degraus: com dois
 *  arquivos ela só podia mostrar 0%, 50% e 100%, e o tempo todo em que o envio
 *  dos bytes acontecia (a parte mais lenta num lote grande) ela ficava parada em
 *  zero. O número precisa andar enquanto o trabalho anda. */
export interface ProgressoEnvio {
  fase: 'enviando' | 'lendo'
  /** Arquivos já lidos (a contagem que a tela mostra por extenso). */
  feitos: number
  total: number
  /** Progresso real do lote, de 0 a 1. */
  fracao: number
  atual?: string | null
}

// Peso de cada fase na barra. O envio dos bytes é medido de verdade (XHR), e a
// leitura é medida por arquivo concluído; as duas somam 100%.
//
// 30/70 porque ler os PDFs é o que domina o relógio: subir 10 arquivos leva
// segundos, lê-los leva mais de um minuto. Um peso igual faria a barra correr
// até a metade e depois rastejar — a impressão de travamento que ela existe para
// evitar.
const PESO_ENVIO = 0.3
const PESO_LEITURA = 0.7

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
  onProgresso?: (p: ProgressoEnvio) => void,
): Promise<UploadCensoResponse> {
  onProgresso?.({ fase: 'enviando', feitos: 0, total: files.length, fracao: 0 })
  const stage = await apiUpload<StageResponse>('/upload/stage', formDe(files), ({ enviados, total }) => {
    // A fração de bytes ocupa a primeira faixa da barra. O `min` protege do
    // caso em que o navegador reporta `loaded` maior que `total` (acontece com
    // o overhead do multipart em alguns browsers) e a barra passaria do peso.
    const parcial = total > 0 ? Math.min(enviados / total, 1) : 0
    onProgresso?.({
      fase: 'enviando', feitos: 0, total: files.length, fracao: parcial * PESO_ENVIO,
    })
  })

  // Os nomes que o BACKEND gravou, não os do `File`: a gravação sanitiza o nome
  // (ver uploads.py), e pedir o processamento pelo nome original não acharia o
  // arquivo em disco. O stage devolve a lista já como ela ficou.
  const nomes = stage.arquivos?.length
    ? stage.arquivos
    : files.map((f) => f.name)

  // UM ARQUIVO POR CHAMADA, em série.
  //
  // A rota aceita `arquivos: [...]` (era o caminho do reprocessamento parcial do
  // assistente), então processar de um em um não pediu nada do backend. É o que
  // torna a porcentagem REAL: cada resposta significa um arquivo efetivamente
  // lido e gravado, e não um palpite de cronômetro.
  //
  // Em série, não em paralelo: o processamento grava no banco, e disparar N
  // importações concorrentes multiplicaria a carga e embaralharia a ordem dos
  // resultados — além de o client Supabase do backend ser um singleton que não
  // gosta de concorrência.
  const resultados: UploadCensoResponse['resultados'] = []
  for (const [i, nome] of nomes.entries()) {
    onProgresso?.({
      fase: 'lendo', feitos: i, total: nomes.length, atual: nome,
      fracao: PESO_ENVIO + (i / nomes.length) * PESO_LEITURA,
    })
    // O mapa de hospitais é recortado para este arquivo: mandar o lote inteiro
    // funcionaria, mas o backend só usa a entrada do arquivo que está lendo.
    const doArquivo = hospitais?.[nome]
    try {
      const parcial = await apiFetch<UploadCensoResponse>('/upload/processar', {
        method: 'POST',
        body: {
          sessao: stage.sessao,
          arquivos: [nome],
          ...(doArquivo ? { hospitais: { [nome]: doArquivo } } : {}),
        },
        timeoutMs: 120_000,
      })
      resultados.push(...(parcial.resultados ?? []))
    } catch (e) {
      // O lote CONTINUA. Um PDF corrompido no meio de dez não pode custar os
      // outros nove — e o resultado precisa dizer o que houve com ele, senão o
      // arquivo sumiria da tela sem explicação. Mesmo formato que o backend
      // usaria, para a tela não precisar saber de onde veio o erro.
      resultados.push({
        arquivo: nome,
        erro: (e as Error).message || 'Não foi possível ler este arquivo.',
        erro_tipo: 'formato_desconhecido',
      })
    }
  }
  onProgresso?.({ fase: 'lendo', feitos: nomes.length, total: nomes.length, fracao: 1 })
  return { sessao: stage.sessao, resultados }
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
 *  anterior para restaurar, e apagar destruiria dado anterior ao envio.
 *
 *  `arquivo` desfaz só aquele do lote; sem ele, a sessão inteira. */
export function reverterEnvioCenso(
  sessao: string, arquivo?: string,
): Promise<ReverterEnvioResposta> {
  const q = arquivo ? `?arquivo=${encodeURIComponent(arquivo)}` : ''
  return apiFetch(`/upload/envios/${encodeURIComponent(sessao)}/reverter${q}`,
                  { method: 'POST' })
}
