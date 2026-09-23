// Serviço de dados do domínio "internação" (detalhe do paciente no drawer).
import { apiDownload, apiFetch } from '../api/client'
import type { InternacaoDados, InternacaoRelatorios, InternacaoTimeline } from '../types/api'

export interface RelatorioRapido {
  data_visita: string
  medico: string
  descricao: string
  autor?: string
}

/** Dados completos de uma internação (histórico, relatórios, eventos). */
export function fetchInternacaoDados(id: number): Promise<InternacaoDados> {
  return apiFetch<InternacaoDados>(`/internacao/${id}/dados`)
}

/** Timeline cronológica da internação (admissão, relatórios, alta, pendências). */
export function fetchInternacaoTimeline(id: number): Promise<InternacaoTimeline> {
  return apiFetch<InternacaoTimeline>(`/internacao/${id}/timeline`)
}

/** Relatórios da internação (com anexo, autoria e data/hora do anexo). */
export function fetchInternacaoRelatorios(id: number): Promise<InternacaoRelatorios> {
  return apiFetch<InternacaoRelatorios>(`/internacao/${id}/relatorios`)
}

/** Baixa o documento anexado a um relatório. O backend redireciona (307) para uma
 *  signed URL de vida curta no Storage; o fetch autenticado segue o redirect. */
export function baixarAnexoRelatorio(relatorioId: number, nomeArquivo: string): Promise<void> {
  return apiDownload(`/relatorio/${relatorioId}/arquivo`, nomeArquivo)
}

// Campos que o backend aceita editar (espelha CAMPOS_EDITAVEIS no repositório).
// Mantê-los tipados evita enviar chaves que o backend descartaria silenciosamente.
export interface InternacaoEdicao {
  nome?: string
  /** Senha de autorização: identifica o paciente nos censos sem coluna de nome. */
  senha?: string
  atendimento?: string
  /** Número do paciente na operadora, lido do censo (migration 0028). */
  carteirinha?: string
  data_entrada?: string
  hora_entrada?: string
  data_alta?: string
  hora_alta?: string
  tipo_leito?: string
  leito_codigo?: string
  especialidade?: string
  convenio?: string
  /** Operadora que rege o paciente. Corrigir só o `convenio` troca o texto e
   *  deixa o paciente na operadora errada: as regras de avaliação (dias_uti,
   *  prazo de relatório) saem daqui. É a key do cadastro, não o nome. */
  operadora_key?: string
  categoria?: string
  diagnostico?: string
  medico?: string
  idade?: string
  sexo?: string
  rn?: string
  status?: string
  obs?: string
}

/** Edita os dados de uma internação. Autoria é derivada do usuário logado no backend. */
export function editarInternacao(id: number, mudancas: InternacaoEdicao): Promise<{
  atualizado?: boolean
  campos_alterados?: string[]
  mensagem?: string
}> {
  return apiFetch(`/internacao/${id}/editar`, { method: 'POST', body: mudancas })
}

/** Apaga uma internação de vez. IRREVERSÍVEL — leva junto relatórios, eventos e
 *  análises daquele paciente (cascata no banco). Só admin; fora do escopo de
 *  hospitais do usuário responde 404. */
export function excluirInternacao(id: number): Promise<{
  ok?: boolean
  nome?: string | null
  atendimento?: string | null
  /** A ficha que foi apagada, para a tela poder DESFAZER (recria o paciente).
   *  Sem `id`/carimbos de censo: recriar gera um registro novo. */
  ficha?: Record<string, unknown>
}> {
  return apiFetch(`/internacao/${id}`, { method: 'DELETE' })
}

/** Tira um paciente da lista de UM censo, sem apagá-lo do sistema.
 *
 *  É o X da conferência do envio. O backend decide o que fazer pela origem do
 *  registro: se o censo CRIOU a internação, ela é apagada (sem o envio não
 *  existiria); se ela já existia, FICA — com relatórios e histórico intactos — e
 *  só a presença dela naquele censo sai.
 *
 *  `apagado` diz qual dos dois aconteceu, e é o que decide se a tela oferece
 *  desfazer (só o caminho que apagou devolve `ficha`). */
export function removerPacienteDoCenso(censoId: number, internacaoId: number): Promise<{
  ok?: boolean
  /** `true` = a ficha saiu do sistema; `false` = só saiu da lista deste censo. */
  apagado?: boolean
  nome?: string | null
  atendimento?: string | null
  mensagem?: string
  /** Só quando `apagado`: a ficha para recriar o paciente. */
  ficha?: Record<string, unknown>
}> {
  return apiFetch(`/censo/${censoId}/paciente/${internacaoId}`, { method: 'DELETE' })
}

/** Recria um paciente apagado há pouco — o desfazer da exclusão. Recebe a `ficha`
 *  que `excluirInternacao` devolveu. Ganha id NOVO; relatórios e histórico não
 *  voltam (caíram por cascata). Só admin. */
export function restaurarInternacao(ficha: Record<string, unknown>): Promise<{
  ok?: boolean
  internacao_id?: number
  ja_existia?: boolean
}> {
  return apiFetch('/internacoes/restaurar', { method: 'POST', body: ficha })
}

/** Registra um relatório rápido a partir do drawer do paciente. */
export function registrarRelatorioRapido(id: number, rel: RelatorioRapido): Promise<unknown> {
  return apiFetch(`/internacao/${id}/relatorio-rapido`, {
    method: 'POST',
    body: { autor: 'operador', ...rel },
  })
}

/**
 * Agenda a visita. `data` é ISO (AAAA-MM-DD) e precisa ser hoje ou futura: para
 * uma visita que já aconteceu o caminho é `registrarRelatorioRapido`. `medico`
 * (de QUEM é a visita) e `hora` ("HH:MM") são obrigatórios — o backend recusa
 * sem os dois. Move o card do paciente para a coluna "Aguardando visita".
 */
export function agendarVisita(id: number, data: string, medico: string, hora: string): Promise<unknown> {
  return apiFetch(`/internacao/${id}/visita-agendada`, {
    method: 'POST',
    body: { data, medico, hora },
  })
}

/** Desfaz o agendamento: o card volta para a fila de "Sem relatório". */
export function desmarcarVisita(id: number): Promise<unknown> {
  return apiFetch(`/internacao/${id}/visita-agendada`, { method: 'DELETE' })
}

/** Um convênio que a tela pode oferecer. Vem de duas fontes (ver `listarConvenios`). */
export interface ConvenioVisto {
  /** O texto que identifica o convênio: a grafia do cadastro quando existe,
   *  senão a que veio do PDF — é por ele que o usuário reconhece a linha. */
  convenio: string
  /** Quantas internações trouxeram este convênio. 0 = cadastrado e ainda não
   *  visto em censo nenhum. */
  total: number
  /** A operadora do cadastro; na falta dele, a mais frequente do histórico.
   *  `null` = nunca casou com nenhuma; a tela mostra a opção e o usuário escolhe
   *  a operadora à mão. */
  operadora_key?: string | null
  operadora_nome?: string | null
  /** Veio do cadastro de convênios, não só do histórico: o vínculo com a
   *  operadora foi DECIDIDO por alguém, não inferido pela frequência. */
  cadastrado?: boolean
}

/** Os convênios que a tela pode oferecer, com a operadora de cada um.
 *
 *  Duas fontes: o CADASTRO de convênios (migration 0026, o que alguém decidiu
 *  que existe) e o HISTÓRICO do que os censos trouxeram (`internacoes.convenio`
 *  é texto livre lido do PDF). Onde as duas falam do mesmo nome, o cadastro
 *  vence — ele é decisão, o histórico é estatística. */
export function listarConvenios(): Promise<{
  convenios: ConvenioVisto[]
  operadoras: { key: string; nome: string }[]
}> {
  return apiFetch('/convenios')
}

/** Cadastra um convênio novo, já vinculado a uma operadora.
 *
 *  Só diretor e admin (o backend responde 403 aos demais): decidir que um nome
 *  de convênio existe e a quem ele pertence muda o que todas as telas oferecem.
 *  Não altera paciente nenhum — o convênio passa a existir na LISTA, e a
 *  correção do paciente é o passo seguinte.
 *
 *  Erros vêm como `ApiError`: 400 (operadora fora do cadastro) e 409 (nome já
 *  cadastrado — a mensagem diz em qual operadora ele está). */
export function criarConvenio(nome: string, operadoraKey: string): Promise<{
  ok?: boolean
  convenio: ConvenioVisto
}> {
  return apiFetch('/convenios', {
    method: 'POST',
    body: { nome, operadora_key: operadoraKey },
  })
}
