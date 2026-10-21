// O formulário "Solicitação de prorrogação" da Porto Saúde: os campos da folha
// e como eles nascem preenchidos. Funções puras: sem estado, sem servidor.
//
// A folha tem dois lados. O da esquerda ("Campo exclusivo de solicitação e
// consenso") é o pedido, e é ele que sai preenchido: dados do paciente, os
// períodos da prorrogação, a justificativa e as negociações, os procedimentos
// TUSS e a medicação de alto custo do relatório escolhido. O da direita
// ("Validação do auditor da Porto") é de quem valida na operadora e sai em
// branco. Tudo continua editável na tela antes de imprimir.
import { dataBR, diasNoPeriodo } from '../../lib/datas'
import { TIPOS_ALTO_CUSTO, rotulo } from '../../lib/relatorioDetalhes'
import type { InternacaoDados, RelatorioItem } from '../../types/api'

/** Chave da operadora no cadastro (migration 0002). */
export const OPERADORA_PORTO = 'porto'

export function ehPorto(d: Pick<InternacaoDados, 'operadora_key'> | null | undefined): boolean {
  return d?.operadora_key === OPERADORA_PORTO
}

/** "( ) SIM ( ) NÃO": nenhum marcado até alguém escolher. */
export type SimNao = 'sim' | 'nao' | null

export interface PeriodoSolicitado {
  de: string
  ate: string
  leito: string
  globalizada: SimNao
  isolamento: SimNao
  consenso: SimNao
}

export interface PeriodoValidado {
  de: string
  ate: string
  leito: string
  qtd: string
  globalizada: SimNao
  isolamento: SimNao
}

export interface TussSolicitado {
  codigo: string
  descricao: string
  qtd: string
  consenso: SimNao
}

export interface TussAutorizado {
  codigo: string
  descricao: string
  qtd: string
  data: string
  dut: string
}

export interface Medicamento {
  medicamento: string
  dose: string
  data: string
  tempo: string
}

export interface FolhaPortoValores {
  hospital: string
  nome: string
  senha: string
  carteirinha: string
  dataInternacao: string
  horaInternacao: string
  dataAlta: string
  horaAlta: string
  madrugada: SimNao
  madrugadaJustificativa: string
  altaTardia: SimNao
  altaTardiaJustificativa: string
  periodosSolicitados: PeriodoSolicitado[]
  periodosValidados: PeriodoValidado[]
  negociacao: string
  resultado: string
  tussSolicitados: TussSolicitado[]
  tussAutorizados: TussAutorizado[]
  medSolicitados: Medicamento[]
  medValidados: Medicamento[]
  observacoes: string
}

/** As listas da folha, que andam em pares (esquerda e direita na mesma linha). */
export type ListaFolha =
  | 'periodosSolicitados' | 'periodosValidados'
  | 'tussSolicitados' | 'tussAutorizados'
  | 'medSolicitados' | 'medValidados'

// Linhas impressas de cada tabela, como na folha original. Um relatório com
// mais itens estica a tabela (dos dois lados, para as linhas continuarem pareadas).
const LINHAS_PERIODO = 6
const LINHAS_TUSS = 6
const LINHAS_MEDICAMENTO = 4

const periodoVazio = (): PeriodoSolicitado =>
  ({ de: '', ate: '', leito: '', globalizada: null, isolamento: null, consenso: null })
const validadoVazio = (): PeriodoValidado =>
  ({ de: '', ate: '', leito: '', qtd: '', globalizada: null, isolamento: null })
const tussVazio = (): TussSolicitado => ({ codigo: '', descricao: '', qtd: '', consenso: null })
const autorizadoVazio = (): TussAutorizado => ({ codigo: '', descricao: '', qtd: '', data: '', dut: '' })
const medicamentoVazio = (): Medicamento => ({ medicamento: '', dose: '', data: '', tempo: '' })

/** Completa a lista até `n` linhas com linhas em branco. */
function ate<T>(itens: T[], n: number, vazio: () => T): T[] {
  return [...itens, ...Array.from({ length: Math.max(0, n - itens.length) }, vazio)]
}

const periodo = (ini?: string | null, fim?: string | null) =>
  ini ? (fim ? `${dataBR(ini)} a ${dataBR(fim)}` : `a partir de ${dataBR(ini)}`) : ''

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/** O relatório que a folha usa ao abrir: o mais recente com pedido de
 *  prorrogação, que é o motivo de a Porto pedir o formulário; sem nenhum, o
 *  mais recente. `relatorios` vem do mais recente para o mais antigo. */
export function relatorioPadrao(relatorios: RelatorioItem[] | undefined): RelatorioItem | null {
  if (!relatorios?.length) return null
  return relatorios.find((r) => r.prorrogacao?.periodos.length) ?? relatorios[0]
}

/** O texto de "Negociação de códigos e diárias": a justificativa do pedido e o
 *  que foi negociado com o hospital (folha rosa e troca de procedimento). */
function textoNegociacao(r: RelatorioItem): string {
  const linhas: string[] = []
  const p = r.prorrogacao
  const justificativa = [p?.justificativa_desc, p?.complemento].filter(Boolean).join('. ')
  if (justificativa) linhas.push(`Justificativa: ${justificativa}`)
  const fr = r.folha_rosa
  if (fr) {
    const quando = periodo(fr.data_inicio, fr.data_fim)
    linhas.push(`Folha rosa: paciente em ${fr.de}, cobrado como ${fr.para} por ${plural(fr.diarias, 'diária', 'diárias')}`
      + (quando ? ` (${quando})` : ''))
  }
  for (const t of r.detalhes?.trocas_procedimento ?? []) {
    linhas.push(`Troca de procedimento: ${t.codigo_de} ${t.nome_de} por ${t.codigo_para} ${t.nome_para}`
      + (t.data ? ` (${dataBR(t.data)})` : ''))
  }
  return linhas.join('\n')
}

/** Os CIDs do relatório, o principal primeiro; sem eles, o diagnóstico do censo. */
function textoObservacoes(d: InternacaoDados, r: RelatorioItem | null): string {
  const cids = [...(r?.cids ?? [])].sort((a, b) =>
    Number(b.codigo === r?.detalhes?.cid_principal) - Number(a.codigo === r?.detalhes?.cid_principal))
  if (cids.length) return `CID: ${cids.map((c) => (c.descricao ? `${c.codigo} ${c.descricao}` : c.codigo)).join('; ')}`
  return d.diagnostico ? `Diagnóstico: ${d.diagnostico}` : ''
}

/** A folha como ela abre: o paciente e, havendo, o relatório escolhido. */
export function preencherFolha(d: InternacaoDados, r: RelatorioItem | null): FolhaPortoValores {
  const periodos: PeriodoSolicitado[] = (r?.prorrogacao?.periodos ?? []).map((x) => ({
    ...periodoVazio(),
    de: dataBR(x.data_inicio),
    ate: dataBR(x.data_fim),
    leito: x.acomodacao.toUpperCase(),
  }))
  const tuss: TussSolicitado[] = (r?.detalhes?.procedimentos ?? []).map((x) => ({
    ...tussVazio(),
    codigo: x.codigo,
    descricao: x.nome,
    qtd: x.qtde ? String(x.qtde) : '',
  }))
  const medicamentos: Medicamento[] = (r?.detalhes?.alto_custo ?? []).map((x) => {
    const dias = diasNoPeriodo(x.data_inicio ?? '', x.data_fim ?? '')
    return {
      medicamento: x.medicacao || rotulo(TIPOS_ALTO_CUSTO, x.tipo),
      dose: x.dose ?? '',
      data: x.data_fim ? periodo(x.data_inicio, x.data_fim) : dataBR(x.data_inicio),
      tempo: dias ? plural(dias, 'dia', 'dias') : '',
    }
  })

  const nPeriodos = Math.max(LINHAS_PERIODO, periodos.length)
  const nTuss = Math.max(LINHAS_TUSS, tuss.length)
  const nMedicamentos = Math.max(LINHAS_MEDICAMENTO, medicamentos.length)

  return {
    hospital: (d.hospital_nome ?? '').toUpperCase(),
    nome: d.nome ?? '',
    senha: d.senha ?? '',
    carteirinha: d.carteirinha ?? '',
    dataInternacao: dataBR(d.data_entrada),
    horaInternacao: (d.hora_entrada ?? '').slice(0, 5),
    dataAlta: dataBR(d.data_alta),
    horaAlta: (d.hora_alta ?? '').slice(0, 5),
    madrugada: null,
    madrugadaJustificativa: '',
    altaTardia: null,
    altaTardiaJustificativa: '',
    periodosSolicitados: ate(periodos, nPeriodos, periodoVazio),
    periodosValidados: ate([], nPeriodos, validadoVazio),
    negociacao: r ? textoNegociacao(r) : '',
    resultado: '',
    tussSolicitados: ate(tuss, nTuss, tussVazio),
    tussAutorizados: ate([], nTuss, autorizadoVazio),
    medSolicitados: ate(medicamentos, nMedicamentos, medicamentoVazio),
    medValidados: ate([], nMedicamentos, medicamentoVazio),
    observacoes: textoObservacoes(d, r),
  }
}
