// Contas da aba "Acompanhamento" do Painel do Gestor (13/11/2026, pedido do
// usuário: "uma parte gráfica somente para os pacientes de prorrogação, home
// care e etc."). Tudo sai de `pacientes_dia`, que já traz a prorrogação, a
// negociação (folha rosa) e o home care de cada paciente: nada novo no backend.
// Funções puras; a tela só desenha.
import type { PacienteDia } from '../../types/api'
import { SITUACOES, type SituacaoFiltro } from './gestor.model'
import { ALIMENTACAO, CONSCIENCIA, OXIGENIOTERAPIA } from '../../lib/altaHomecare'

/** Cores das três situações nos gráficos. Validadas juntas (luminosidade,
 *  croma, daltonismo e contraste no branco): azul, rosa e verde. O rosa é o da
 *  folha rosa. O verde é o mesmo `--success` do KPI de home care. */
export const COR_SITUACAO = {
  prorrogacao: '#1A5DA8',
  negociacao: '#D04A7E',
  homecare: '#0E7A53',
} as const

const aplica = (key: Exclude<SituacaoFiltro, ''>) => SITUACOES.find((s) => s.key === key)!.aplica
export const ehProrrogado = aplica('prorrogados')
export const temNegociacao = aplica('negociacao')
export const ehHomecare = aplica('homecare')

/** Está em alguma situação de acompanhamento (a aba só mostra esses). */
export const emAcompanhamento = (p: PacienteDia) => SITUACOES.some((s) => s.aplica(p))

const diasEntre = (de: string, ate: string) =>
  Math.round((Date.parse(`${ate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${de.slice(0, 10)}T00:00:00Z`)) / 864e5)

// ── Prorrogação ──────────────────────────────────────────────────────────
/** Quanto falta para a prorrogação terminar, contado do dia analisado no
 *  painel (o mesmo dia em que o backend decide quem está prorrogado). */
export const FAIXAS_VENCIMENTO = [
  { key: 'hoje', label: 'Termina hoje' },
  { key: '1_3', label: '1 a 3 dias' },
  { key: '4_7', label: '4 a 7 dias' },
  { key: '8_15', label: '8 a 15 dias' },
  { key: '16p', label: '16+ dias' },
  { key: 'pausada', label: 'Pausada' },
] as const

export type FaixaVencimento = (typeof FAIXAS_VENCIMENTO)[number]['key']

export function faixaVencimento(p: PacienteDia, dia: string): FaixaVencimento | null {
  const pr = p.prorrogacao
  if (!pr) return null
  if (pr.pausada) return 'pausada'
  // Sem data de fim não acontece (o backend só marca com data); se vier,
  // conta como a mais distante, para não sumir do total.
  if (!pr.ate) return '16p'
  const n = diasEntre(dia, pr.ate)
  if (n <= 0) return 'hoje'
  if (n <= 3) return '1_3'
  if (n <= 7) return '4_7'
  if (n <= 15) return '8_15'
  return '16p'
}

export function vencimentos(lista: PacienteDia[], dia: string): Record<FaixaVencimento, number> {
  const out = Object.fromEntries(FAIXAS_VENCIMENTO.map((f) => [f.key, 0])) as Record<FaixaVencimento, number>
  for (const p of lista) {
    const f = faixaVencimento(p, dia)
    if (f) out[f] += 1
  }
  return out
}

// ── Por hospital ─────────────────────────────────────────────────────────
export interface HospitalAcompanhamento {
  key: string
  nome: string
  prorrogacao: number
  negociacao: number
  homecare: number
  /** Pacientes distintos (um paciente pode estar em mais de uma situação). */
  pacientes: number
}

export function porHospital(lista: PacienteDia[]): HospitalAcompanhamento[] {
  const mapa = new Map<string, HospitalAcompanhamento>()
  for (const p of lista) {
    const pr = ehProrrogado(p), ng = temNegociacao(p), hc = ehHomecare(p)
    if (!pr && !ng && !hc) continue
    const key = p.hospital_key ?? ''
    const h = mapa.get(key) ?? { key, nome: p.hospital_nome || 'Sem hospital', prorrogacao: 0, negociacao: 0, homecare: 0, pacientes: 0 }
    h.prorrogacao += pr ? 1 : 0
    h.negociacao += ng ? 1 : 0
    h.homecare += hc ? 1 : 0
    h.pacientes += 1
    mapa.set(key, h)
  }
  const total = (h: HospitalAcompanhamento) => h.prorrogacao + h.negociacao + h.homecare
  return [...mapa.values()].sort((a, b) => total(b) - total(a) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

// ── Negociação (folha rosa) ──────────────────────────────────────────────
export interface ResumoNegociacao {
  total: number
  diarias: number
  aceite: { sim: number; nao: number; aguardando: number; sem_resposta: number }
  /** Dias desde o início da negociação mais antiga que ainda espera o aceite. */
  esperaMaisLonga: number | null
  /** Troca de acomodação negociada (de → para), a mais frequente primeiro. */
  trocas: Array<{ de: string; para: string; pacientes: number; diarias: number }>
}

export function resumoNegociacao(lista: PacienteDia[], dia: string): ResumoNegociacao {
  const r: ResumoNegociacao = {
    total: 0, diarias: 0,
    aceite: { sim: 0, nao: 0, aguardando: 0, sem_resposta: 0 },
    esperaMaisLonga: null, trocas: [],
  }
  const trocas = new Map<string, ResumoNegociacao['trocas'][number]>()
  for (const p of lista) {
    const n = p.negociacao
    if (!n) continue
    r.total += 1
    r.diarias += n.diarias ?? 0
    if (n.aceite === 'sim' || n.aceite === 'nao' || n.aceite === 'aguardando') r.aceite[n.aceite] += 1
    else r.aceite.sem_resposta += 1
    if (n.aceite === 'aguardando' && n.data_inicio) {
      const espera = Math.max(diasEntre(n.data_inicio, dia), 0)
      r.esperaMaisLonga = Math.max(r.esperaMaisLonga ?? 0, espera)
    }
    const de = (n.de ?? '').trim() || '?'
    const para = (n.para ?? '').trim() || '?'
    const k = `${de.toLowerCase()}→${para.toLowerCase()}`
    const t = trocas.get(k) ?? { de, para, pacientes: 0, diarias: 0 }
    t.pacientes += 1
    t.diarias += n.diarias ?? 0
    trocas.set(k, t)
  }
  r.trocas = [...trocas.values()].sort((a, b) => b.pacientes - a.pacientes || b.diarias - a.diarias)
  return r
}

// ── Home care ────────────────────────────────────────────────────────────
export interface ItemHomecare {
  key: string
  label: string
  total: number
  /** O que compõe o total, quando há mais de um tipo ("2 O₂ contínuo · 1 BIPAP/CPAP"). */
  detalhe?: string
}

export interface ResumoHomecare {
  /** Todos os pacientes em home care (inclui as altas antigas com o motivo). */
  total: number
  /** Os que têm as respostas do relatório: a base das porcentagens. */
  comRespostas: number
  itens: ItemHomecare[]
}

const rotulo = (lista: readonly { key: string; label: string }[], key: string) =>
  lista.find((x) => x.key === key)?.label ?? key

function detalhar(contagem: Map<string, number>, lista: readonly { key: string; label: string }[]) {
  if (contagem.size < 2) return undefined
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${rotulo(lista, k)}`).join(' · ')
}

/** O que os pacientes em home care precisam, na ordem das perguntas do
 *  relatório. Só conta o que foi respondido: pergunta em branco não é "não". */
export function resumoHomecare(lista: PacienteDia[]): ResumoHomecare {
  const emHc = lista.filter(ehHomecare)
  const com = emHc.map((p) => p.homecare).filter((h): h is NonNullable<PacienteDia['homecare']> => h != null)
  const oxi = new Map<string, number>(), cons = new Map<string, number>(), alim = new Map<string, number>()
  const soma = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
  let solicitado = 0, leito = 0, acesso = 0, traqueo = 0, curativo = 0, ostomias = 0, oxiTotal = 0, consTotal = 0, alimTotal = 0
  for (const h of com) {
    if (h.solicitado) solicitado += 1
    if (h.oxigenioterapia && h.oxigenioterapia !== 'nao') { oxiTotal += 1; soma(oxi, h.oxigenioterapia) }
    if (h.mobilizacao === 'restrito_leito') leito += 1
    if (h.consciencia && h.consciencia !== 'lucido') { consTotal += 1; soma(cons, h.consciencia) }
    if (h.acesso_venoso) acesso += 1
    if (h.traqueostomia) traqueo += 1
    if (h.curativo) curativo += 1
    if (h.ostomias) ostomias += 1
    const naoOral = (h.alimentacao ?? []).filter((a) => a !== 'oral')
    if (naoOral.length) { alimTotal += 1; naoOral.forEach((a) => soma(alim, a)) }
  }
  return {
    total: emHc.length,
    comRespostas: com.length,
    itens: [
      { key: 'solicitado', label: 'Home care solicitado', total: solicitado },
      { key: 'oxigenio', label: 'Oxigenioterapia', total: oxiTotal, detalhe: detalhar(oxi, OXIGENIOTERAPIA) },
      { key: 'leito', label: 'Restrito ao leito', total: leito },
      { key: 'consciencia', label: 'Consciência alterada', total: consTotal, detalhe: detalhar(cons, CONSCIENCIA) },
      { key: 'acesso_venoso', label: 'Acesso venoso', total: acesso },
      { key: 'traqueostomia', label: 'Traqueostomia', total: traqueo },
      { key: 'curativo', label: 'Curativo', total: curativo },
      { key: 'ostomias', label: 'Ostomias', total: ostomias },
      { key: 'alimentacao', label: 'Alimentação por sonda ou parenteral', total: alimTotal, detalhe: detalhar(alim, ALIMENTACAO) },
    ],
  }
}

// ── Permanência ──────────────────────────────────────────────────────────
/** Média de dias de internação de quem está na situação (null sem ninguém). */
export function mediaDias(lista: PacienteDia[], filtro: (p: PacienteDia) => boolean): number | null {
  const sel = lista.filter(filtro)
  if (!sel.length) return null
  return Math.round(sel.reduce((s, p) => s + p.dias, 0) / sel.length)
}
