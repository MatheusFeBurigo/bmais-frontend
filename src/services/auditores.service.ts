// Módulo 2 > Auditores (16/11/2026, migration 0062): os documentos de cada
// médico e enfermeiro auditor. O coordenador operacional, o Operacional e o
// admin pedem os documentos do catálogo, inserem outros pelo nome (17/11/2026),
// registram o arquivo recebido e cancelam um pedido; diretoria, gestão,
// coordenação técnica e analista consultam.
// Backend: routes/auditores.py.
import { apiDownload, apiFetch, apiUpload } from '../api/client'

/** Situação de um documento do auditor (DOC_ST do protótipo do App). `em_analise` (24/11/2026,
 *  migration 0072): enviado pelo auditor no App, aguardando a aprovação da B+. */
export type SituacaoDocumento = 'nao_pedido' | 'falta' | 'em_analise' | 'em_dia' | 'vence' | 'vencido'
/** Situação geral do auditor (DOC_RES do protótipo); "sem" = nada atribuído; "analise" = algum
 *  documento aguardando a aprovação da B+ (e nada faltando ou vencido). */
export type SituacaoGeral = 'pendente' | 'analise' | 'vence' | 'em_dia' | 'sem'

export interface ResumoDocumentos {
  falta: number
  vencido: number
  /** Aguardando a aprovação da B+ (0072). Ausente em servidor anterior. */
  em_analise?: number
  vence: number
  em_dia: number
  total: number
  geral: SituacaoGeral
}

export interface Auditor {
  id: number
  nome: string
  /** 'M' médico, 'E' enfermeiro (cadastro de profissionais). */
  tipo: string | null
  ativo: boolean
}

export interface AuditorNaLista extends Auditor {
  resumo: ResumoDocumentos
  ultimo_envio: string | null
}

export interface ListaAuditores {
  auditores: AuditorNaLista[]
  pode_gerir: boolean
  /** Falso enquanto a migration 0062 não estiver no banco. */
  disponivel: boolean
  vence_em_dias: number
}

export interface TipoDocumento {
  id: number
  nome: string
  dono: 'auditor' | 'empresa'
  com_validade: boolean
  /** Documentação padrão: todo auditor abre com ele pendente. Falso = um dos
   * "Outros documentos" inseridos pelo Operacional. */
  padrao: boolean
}

/** Um registro de documento: um pedido e o arquivo que o atendeu. */
export interface RegistroDocumento {
  id: number
  tipo_id: number
  tipo_nome: string
  dono: 'auditor' | 'empresa'
  situacao: 'pedido' | 'enviado' | 'cancelado'
  situacao_documento: SituacaoDocumento | null
  pedido_em: string | null
  pedido_por_nome: string | null
  /** Pedido automático da documentação padrão (no cadastro do auditor). */
  pedido_padrao?: boolean
  /** O que a B+ escreveu para o auditor ao pedir (0073). */
  pedido_observacao?: string | null
  enviado_em: string | null
  enviado_por_nome: string | null
  enviado_via: 'portal' | 'app' | null
  validade: string | null
  arquivo_nome: string | null
  arquivo_bytes: number | null
  tem_arquivo: boolean
  /** O nome padronizado do arquivo baixado: "Nome do auditor - Nome do documento.ext" (17/11/2026). */
  nome_download?: string | null
  cancelado_em: string | null
  cancelado_por_nome: string | null
  /** Aprovação pela B+ (0072): null nos registros antigos, que valem como aprovados. */
  aprovacao?: 'pendente' | 'aprovado' | 'recusado' | null
  aprovacao_em?: string | null
  aprovacao_por_nome?: string | null
  recusa_motivo?: string | null
}

export interface DocumentoDoAuditor {
  tipo: TipoDocumento
  situacao: SituacaoDocumento
  /** O pedido em aberto, se houver. */
  pedido: RegistroDocumento | null
  /** O último arquivo recebido (continua valendo durante uma renovação). */
  arquivo: RegistroDocumento | null
  /** O envio recusado que reabriu o pedido, com o motivo (0072). */
  recusa?: RegistroDocumento | null
}

export interface FichaAuditor {
  auditor: Auditor
  documentos: DocumentoDoAuditor[]
  resumo: ResumoDocumentos
  historico: RegistroDocumento[]
  /** O que pode ser solicitado a este auditor. */
  catalogo: (TipoDocumento & { em_aberto: boolean })[]
  pode_gerir: boolean
  disponivel: boolean
  /** O banco tem a aprovação dos documentos (migration 0072): dá para aprovar e recusar com motivo. */
  aprovacao_disponivel?: boolean
  vence_em_dias: number
}

export function fetchAuditores(): Promise<ListaAuditores> {
  return apiFetch('/auditores')
}

export function fetchFichaAuditor(id: number): Promise<FichaAuditor> {
  return apiFetch(`/auditores/${id}`)
}

/** `observacao` (24/11/2026, 0073): o que o auditor vê no App; obrigatória ao pedir de novo o que já tem arquivo. */
export function pedirDocumentos(id: number, tipos: number[], observacao?: string):
  Promise<{ ok: boolean; pedidos: string[]; ja_pedidos: string[]; auditor: string }> {
  return apiFetch(`/auditores/${id}/documentos/pedir`, { method: 'POST', body: { tipos, ...(observacao ? { observacao } : {}) } })
}

/** Pede ao auditor um documento fora da documentação padrão, pelo nome. */
export function inserirDocumento(id: number, nome: string, comValidade: boolean, observacao?: string):
  Promise<{ ok: boolean; pedidos: string[]; ja_pedidos: string[]; auditor: string; tipo_nome: string; novo: boolean }> {
  return apiFetch(`/auditores/${id}/documentos/inserir`, {
    method: 'POST', body: { nome, com_validade: comValidade, ...(observacao ? { observacao } : {}) },
  })
}

export function cancelarPedidoDocumento(documentoId: number): Promise<unknown> {
  return apiFetch(`/auditores/documentos/${documentoId}/cancelar`, { method: 'POST' })
}

/** A B+ aprova o documento que o auditor enviou pelo App (24/11/2026, 0072). */
export function aprovarDocumento(documentoId: number): Promise<{ ok: boolean; tipo_nome: string; auditor: string }> {
  return apiFetch(`/auditores/documentos/${documentoId}/aprovar`, { method: 'POST' })
}

/** A B+ recusa o documento enviado, com motivo: ele volta a ser pedido ao auditor, que vê o motivo no App. */
export function recusarDocumento(documentoId: number, motivo: string): Promise<{ ok: boolean; tipo_nome: string; auditor: string }> {
  return apiFetch(`/auditores/documentos/${documentoId}/recusar`, { method: 'POST', body: { motivo } })
}

export function receberDocumento(id: number, tipoId: number, arquivo: File, validade: string):
  Promise<{ ok: boolean; atendeu_pedido: boolean; tipo_nome: string }> {
  const form = new FormData()
  form.append('arquivo', arquivo)
  if (validade) form.append('validade', validade)
  return apiUpload(`/auditores/${id}/documentos/${tipoId}/arquivo`, form)
}

export function baixarDocumento(documentoId: number, nome: string): Promise<void> {
  return apiDownload(`/auditores/documentos/${documentoId}/arquivo`, nome)
}

// ── Cadastro e contrato (17/11/2026, migration 0065) ─────────────────────
// A empresa e o registro do auditor (dados cadastrais) e o contrato com a B+
// (só a diretoria vê e edita; para os demais o servidor manda `contrato: null`).
// O App do auditor mostra os dois em Meus dados (sem a senha de desbloqueio, que saiu em 27/11/2026).

export interface CadastroAuditor {
  registro: string | null
  uf: string | null
  empresa_razao_social: string | null
  empresa_cnpj: string | null
  atualizado_em: string | null
  atualizado_por_nome: string | null
}

export interface ContratoAuditor {
  numero: string | null
  modelo: string | null
  desde: string | null
  aditivo: string | null
  termo_bradesco: string | null
  atualizado_em: string | null
  atualizado_por_nome: string | null
}

export interface CadastroEContrato {
  /** Falso enquanto a migration 0065 não estiver no banco. */
  disponivel: boolean
  cadastro: CadastroAuditor
  /** null para quem não vê o contrato. */
  contrato: ContratoAuditor | null
  pode_editar_cadastro: boolean
  pode_ver_contrato: boolean
  pode_editar_contrato: boolean
  /** Os modelos de remuneração que o contrato aceita. */
  modelos: string[]
}

export interface NovoCadastro {
  registro: string | null
  uf: string | null
  empresa_razao_social: string | null
  empresa_cnpj: string | null
}

export interface NovoContrato {
  numero: string | null
  modelo: string | null
  desde: string | null
  aditivo: string | null
  termo_bradesco: string | null
}

export function fetchCadastroAuditor(id: number): Promise<CadastroEContrato> {
  return apiFetch(`/auditores/${id}/cadastro`)
}

export function salvarCadastroAuditor(id: number, body: NovoCadastro): Promise<CadastroEContrato> {
  return apiFetch(`/auditores/${id}/cadastro`, { method: 'PUT', body })
}

export function salvarContratoAuditor(id: number, body: NovoContrato): Promise<CadastroEContrato> {
  return apiFetch(`/auditores/${id}/contrato`, { method: 'PUT', body })
}
