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
 *  `fracao` (0..1) é o progresso CONTÍNUO da fase em curso (envio dos bytes,
 *  conferência ou gravação). Contar só arquivos inteiros dava uma barra de dois degraus: com dois
 *  arquivos ela só podia mostrar 0%, 50% e 100%, e o tempo todo em que o envio
 *  dos bytes acontecia (a parte mais lenta num lote grande) ela ficava parada em
 *  zero. O número precisa andar enquanto o trabalho anda. */
export interface ProgressoEnvio {
  /** `conferindo` (25/11/2026) = a prévia antes de salvar; nada é gravado nela. */
  fase: 'enviando' | 'conferindo' | 'lendo'
  /** Arquivos já lidos (a contagem que a tela mostra por extenso). */
  feitos: number
  total: number
  /** Progresso real do lote, de 0 a 1. */
  fracao: number
  atual?: string | null
  /** Nomes na ordem em que serão lidos, quando não são os arquivos soltos na caixa
   *  (as cópias por hospital de um arquivo distribuído). */
  fila?: string[]
}

// Cada fase (enviar, conferir, gravar) tem a sua barra de 0 a 100%: a prévia de
// 25/11/2026 separou o envio em momentos com uma pausa (a confirmação) no meio.

/** Um grupo de pacientes de um mesmo hospital dentro de um arquivo de censo
 *  (prévia de 25/11/2026). `hospital` é a key do cadastro; null quando a unidade
 *  do arquivo não foi achada lá e a tela pede o hospital. */
export interface GrupoHospitalCenso {
  unidade: string | null
  nome_lido: string | null
  hospital: string | null
  hospital_nome: string | null
  pacientes: number
}

/** O que o envio de um arquivo SALVARIA (rota `/upload/previa`, que não grava nada). */
export interface PreviaCenso {
  arquivo: string
  previa?: boolean
  erro?: string | null
  erro_tipo?: string | null
  precisa_hospital?: boolean
  hospital?: string | null
  hospital_nome?: string | null
  operadora?: string | null
  operadora_nome?: string | null
  tipo?: string | null
  data_censo?: string | null
  periodo_inicio?: string | null
  lidos?: number
  total?: number
  internados?: number
  altas?: number
  pendentes?: number
  /** O hospital que o próprio arquivo indica, quando não é o escolhido. */
  hospital_divergente?: string | null
  /** Vazio = o arquivo é todo do hospital escolhido. */
  hospitais_encontrados?: GrupoHospitalCenso[]
  avisos?: string[]
}

/** Um arquivo a processar depois da confirmação. `unidade`: a cópia de um arquivo
 *  distribuído fica só com os pacientes daquela unidade ("-" = os sem unidade);
 *  "*" grava todos no hospital escolhido. */
export interface ItemEnvioCenso { nome: string; hospital?: HospitalManual; unidade?: string }

/** Fase 1: sobe os arquivos (só grava em disco no servidor) e devolve a sessão e os
 *  nomes COMO O SERVIDOR OS GRAVOU (a gravação sanitiza o nome; é por eles que as
 *  fases seguintes acham os arquivos). */
export async function subirCensos(
  files: File[], onProgresso?: (p: ProgressoEnvio) => void,
): Promise<StageResponse> {
  onProgresso?.({ fase: 'enviando', feitos: 0, total: files.length, fracao: 0 })
  const stage = await apiUpload<StageResponse>('/upload/stage', formDe(files), ({ enviados, total }) => {
    // O `min` protege do navegador que reporta `loaded` maior que `total`.
    const parcial = total > 0 ? Math.min(enviados / total, 1) : 0
    onProgresso?.({ fase: 'enviando', feitos: 0, total: files.length, fracao: parcial })
  })
  return { sessao: stage.sessao, arquivos: stage.arquivos?.length ? stage.arquivos : files.map((f) => f.name) }
}

/** Fase 2 (25/11/2026): a PRÉVIA de cada arquivo, um por chamada, para a tela pedir
 *  a confirmação "você está salvando no hospital X" antes de gravar. Nada é gravado.
 *  Um arquivo que falha não interrompe o lote: volta com o erro, como no processar. */
export async function conferirCensos(
  sessao: string, nomes: string[], hospital?: HospitalManual,
  onProgresso?: (p: ProgressoEnvio) => void,
): Promise<PreviaCenso[]> {
  const previas: PreviaCenso[] = []
  for (const [i, nome] of nomes.entries()) {
    onProgresso?.({ fase: 'conferindo', feitos: i, total: nomes.length, atual: nome, fracao: i / nomes.length })
    try {
      const r = await apiFetch<{ resultados?: PreviaCenso[] }>('/upload/previa', {
        method: 'POST',
        body: { sessao, arquivos: [nome], ...(hospital ? { hospitais: { [nome]: hospital } } : {}) },
        timeoutMs: 120_000,
      })
      previas.push(...(r.resultados ?? []))
    } catch (e) {
      previas.push({ arquivo: nome, erro: (e as Error).message || 'Não foi possível ler este arquivo.' })
    }
  }
  onProgresso?.({ fase: 'conferindo', feitos: nomes.length, total: nomes.length, fracao: 1 })
  return previas
}

/** Separa um arquivo da sessão em uma cópia por hospital (uma por `parte`), para
 *  cada hospital ter o seu envio. Devolve o nome de cada cópia, na ordem das partes. */
export function distribuirCenso(
  sessao: string, arquivo: string, partes: string[],
): Promise<{ sessao: string; arquivos: { parte: string; arquivo: string }[] }> {
  return apiFetch('/upload/distribuir', { method: 'POST', body: { sessao, arquivo, partes } })
}

/** Fase 3: processa (lê e GRAVA) os arquivos confirmados, um por chamada e em série.
 *
 *  Um por chamada torna a porcentagem real (cada resposta é um arquivo gravado); em
 *  série porque o processamento grava no banco, e N importações concorrentes
 *  multiplicariam a carga e embaralhariam a ordem dos resultados. Um arquivo com
 *  erro não interrompe o lote: o resultado dele diz o que houve. */
export async function processarCensos(
  sessao: string, itens: ItemEnvioCenso[], onProgresso?: (p: ProgressoEnvio) => void,
): Promise<UploadCensoResponse> {
  const resultados: UploadCensoResponse['resultados'] = []
  const fila = itens.map((x) => x.nome)
  for (const [i, item] of itens.entries()) {
    onProgresso?.({
      fase: 'lendo', feitos: i, total: itens.length, atual: item.nome, fila, fracao: i / itens.length,
    })
    try {
      const parcial = await apiFetch<UploadCensoResponse>('/upload/processar', {
        method: 'POST',
        body: {
          sessao,
          arquivos: [item.nome],
          ...(item.hospital ? { hospitais: { [item.nome]: item.hospital } } : {}),
          ...(item.unidade ? { unidades: { [item.nome]: item.unidade } } : {}),
        },
        timeoutMs: 120_000,
      })
      resultados.push(...(parcial.resultados ?? []))
    } catch (e) {
      resultados.push({
        arquivo: item.nome,
        erro: (e as Error).message || 'Não foi possível ler este arquivo.',
        erro_tipo: 'formato_desconhecido',
      })
    }
  }
  onProgresso?.({ fase: 'lendo', feitos: itens.length, total: itens.length, fila, fracao: 1 })
  return { sessao, resultados }
}

/** Envio direto, sem a confirmação (sobe e grava): mantido para quem ainda chama.
 *  A tela de envio usa `subirCensos` + `conferirCensos` + `processarCensos`. */
export async function enviarCensos(
  files: File[], hospitais?: Record<string, HospitalManual>,
  onProgresso?: (p: ProgressoEnvio) => void,
): Promise<UploadCensoResponse> {
  const stage = await subirCensos(files, onProgresso)
  return processarCensos(stage.sessao, stage.arquivos.map((nome) => ({ nome, hospital: hospitais?.[nome] })), onProgresso)
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
  /** Preenchido só quando TODOS os arquivos da sessão foram desfeitos. */
  revertido_em?: string | null
  /** Um item por arquivo (censo) do envio, com o estado próprio de reversão. */
  por_arquivo?: Array<{ censo_id: number; arquivo: string; total_pacientes: number; revertido_em?: string | null }>
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

/** Um grupo dos pacientes que o lote só ATUALIZOU, pelo envio que os criou. */
export interface OrigemReversao {
  censo_id: number
  /** Sessão do envio de origem; `null` quando ele está além da janela do
   *  desfazer (200 envios) ou fora do escopo. */
  sessao: string | null
  arquivo: string | null
  processado_em: string | null
  pacientes: number
  /** O desfazer ainda alcança o envio de origem (na janela e aberto). */
  desfazivel: boolean
  /** Mesmo conteúdo (hash) de um dos arquivos a desfazer: é o reenvio dele. */
  mesmo_arquivo: boolean
}

/** O que o desfazer vai apagar, antes de apagar (12/11/2026). */
export interface PreviaReversao {
  ok: boolean
  sessao: string
  arquivo: string | null
  /** Pacientes que o lote criou: os que saem. */
  criados: number
  /** Pacientes que já existiam e o lote só atualizou: ficam. */
  atualizados: number
  /** De qual envio vieram os `atualizados`, do maior grupo ao menor. */
  origens: OrigemReversao[]
  /** Atualizados sem envio de origem (cadastro manual ou antigo). */
  sem_envio: number
}

/** Salva neste hospital (`salvar`) ou descarta os pacientes que o envio segurou
 *  por já estarem em OUTRO hospital com o mesmo atendimento (13/11/2026). */
export function decidirOutroHospital(
  pendenciaIds: number[], salvar: boolean,
): Promise<{ ok: boolean; salvos: number; descartados: number; decididos: number }> {
  return apiFetch('/upload/outro-hospital/decidir', {
    method: 'POST',
    body: { pendencia_ids: pendenciaIds, salvar },
  })
}

/** Prévia do desfazer de um envio (ou de `arquivo`): quantos saem, quantos
 *  ficam e de onde vieram os que ficam. Um reenvio do mesmo arquivo não cria
 *  ninguém, e o desfazer dele removia 0 sem aviso. */
export function fetchPreviaReversao(sessao: string, arquivo?: string): Promise<PreviaReversao> {
  const q = arquivo ? `?arquivo=${encodeURIComponent(arquivo)}` : ''
  return apiFetch(`/upload/envios/${encodeURIComponent(sessao)}/previa${q}`)
}

/** Envios de censo recentes, já recortados ao escopo de hospitais do usuário.
 *  `limite` (até 200, o alcance do desfazer): Movimentações pede a lista longa. */
export function fetchEnviosCenso(limite?: number): Promise<{ envios: EnvioCenso[] }> {
  return apiFetch(`/upload/envios${limite ? `?limite=${limite}` : ''}`)
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
