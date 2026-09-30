// Regras compartilhadas da tela Volumetria. Gráfico, lista e painel leem daqui
// para rótulo e cor de cada nível serem os MESMOS nos três lugares.
//
// O nível em si (normal/atenção/sobrecarga) vem do backend (domain/carga.py):
// é calculado em horas contra a capacidade da pessoa, com limiares absolutos.
// Aqui só se apresenta.
import type {
  UserRole, VolumetriaDivisao, VolumetriaGrupo, VolumetriaHospitalDaPessoa, VolumetriaNivel, VolumetriaPessoa,
  VolumetriaQuebra, VolumetriaRegiaoDaPessoa,
} from '../../types/api'
import { COR } from '../gestor/gestor.styles'
import { colunaKanban } from '../kanban/colunas'

// Cor de status nunca vai sozinha: o rótulo acompanha (legenda, lista, tooltip).
export const NIVEL_LABEL: Record<VolumetriaNivel, string> = {
  normal: 'Dentro da capacidade',
  atencao: 'Atenção',
  sobrecarga: 'Sobrecarga',
}
// Chart.js não lê CSS vars: hex da paleta do Gestor (validada p/ daltonismo).
// `NIVEL_VAR` é o mesmo significado em token, para o que é HTML.
export const NIVEL_HEX: Record<VolumetriaNivel, string> = {
  normal: COR.azul,
  atencao: COR.laranja,
  sobrecarga: COR.vermelho,
}
export const NIVEL_VAR: Record<VolumetriaNivel, string> = {
  normal: 'var(--primary)',
  atencao: 'var(--warning)',
  sobrecarga: 'var(--danger)',
}
export const NIVEIS: readonly VolumetriaNivel[] = ['normal', 'atencao', 'sobrecarga']

// Cores dos gráficos de produtividade, por IDENTIDADE (as mesmas nos três).
// Par validado para daltonismo; laranja/vermelho ficam de fora porque nesta
// tela já são "atenção" e "sobrecarga".
export const COR_ABERTAS = COR.azul
export const COR_CONCLUIDAS = COR.verde

/** Pessoas com área definida: as que entram no gráfico e nas médias. */
export function comVinculo(g: VolumetriaGrupo): VolumetriaPessoa[] {
  return g.pessoas.filter((p) => !p.sem_vinculo)
}

/** Média de dias de fila de quem tem área definida (KPI de referência). */
export function mediaDiasFila(g: VolumetriaGrupo): number {
  const ps = comVinculo(g)
  if (ps.length === 0) return 0
  return ps.reduce((s, p) => s + (p.dias_fila ?? 0), 0) / ps.length
}

/** Maior número de demandas do grupo: a régua da barra dos cartões. */
export function maxDemandas(g: VolumetriaGrupo): number {
  return Math.max(0, ...g.pessoas.map((p) => p.total_pendencias ?? 0))
}

const ROTULO_GRUPO: Record<string, { plural: string; singular: string }> = {
  coordenador_tecnico: { plural: 'Técnicos', singular: 'técnico' },
  coordenador_administrativo: { plural: 'Administrativos', singular: 'administrativo' },
}
export function rotuloGrupo(papel: UserRole): { plural: string; singular: string } {
  return ROTULO_GRUPO[papel] ?? { plural: 'Pessoas', singular: 'pessoa' }
}

// Iniciais para o avatar: 2 primeiras letras significativas do nome/e-mail.
export function iniciais(nome: string): string {
  const base = (nome || '').split('@')[0].trim()
  if (!base) return '?'
  const partes = base.split(/[\s._-]+/).filter(Boolean)
  const letras = partes.length >= 2 ? partes[0][0] + partes[1][0] : base.slice(0, 2)
  return letras.toUpperCase()
}

/** Minúsculas e sem acentos, para "sao" casar com "São". */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function fmt1(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function fmtHoras(h: number | null | undefined): string {
  return h == null ? '—' : `${fmt1(h)} h`
}

export function fmtDias(d: number | null | undefined): string {
  if (d == null) return '—'
  return `${fmt1(d)} ${d === 1 ? 'dia' : 'dias'}`
}

// Badge do nível: as variantes do design system que já significam isso.
export const NIVEL_BADGE: Record<VolumetriaNivel, 'info' | 'warning' | 'danger'> = {
  normal: 'info',
  atencao: 'warning',
  sobrecarga: 'danger',
}

export type OrdemPessoas = 'carga' | 'nome'
export const ORDENS: Array<{ key: OrdemPessoas; label: string }> = [
  { key: 'carga', label: 'Maior carga' },
  { key: 'nome', label: 'Nome' },
]

/** Uma linha da quebra de demandas: rótulo (o mesmo da coluna de Tarefas),
 *  cor do ponto, número e uma sub-linha opcional ("2 vencidas"). */
export interface LinhaQuebra {
  key: keyof VolumetriaQuebra
  label: string
  cor: string
  valor: number
  sub?: string
}

/** Linhas da quebra na ordem em que o quadro de Tarefas as mostra, mais o que
 *  já venceu (que não é coluna, mas é demanda). */
export function linhasQuebra(
  role: 'tecnico' | 'administrativo', q: VolumetriaQuebra | null | undefined,
): LinhaQuebra[] {
  if (!q) return []
  if (role === 'administrativo') {
    const c = colunaKanban('censos_atrasados')
    const atraso = q.maior_atraso ?? 0
    return [{
      key: 'sem_censo', label: c?.titulo ?? 'Censos atrasados', cor: c?.cor ?? 'var(--danger)',
      valor: q.sem_censo ?? 0,
      sub: atraso > 0 ? `maior atraso: ${atraso} ${atraso === 1 ? 'dia' : 'dias'}` : undefined,
    }]
  }
  const sr = colunaKanban('sem_relatorio')
  const av = colunaKanban('aguardando_visita')
  // Linha PRÓPRIA, não sub-linha: o horário virou prazo-limite (22/09/2026) e o
  // quadro passou a ter uma coluna própria para atraso ("Visitas atrasadas"),
  // separada de "Aguardando visita" — a quebra aqui precisa bater com o quadro,
  // senão as duas telas contam o mesmo caso em lugares diferentes.
  const va = colunaKanban('visitas_atrasadas')
  return [
    { key: 'sem_relatorio', label: sr?.titulo ?? 'Sem relatório', cor: sr?.cor ?? 'var(--warning)', valor: q.sem_relatorio ?? 0 },
    { key: 'aguardando_visita', label: av?.titulo ?? 'Aguardando visita', cor: av?.cor ?? 'var(--info)', valor: q.aguardando_visita ?? 0 },
    { key: 'visitas_atrasadas', label: va?.titulo ?? 'Visitas atrasadas', cor: va?.cor ?? 'var(--danger)', valor: q.visitas_atrasadas ?? 0 },
    { key: 'vencido', label: 'Relatório vencido', cor: 'var(--danger)', valor: q.vencido ?? 0 },
    { key: 'proximo_vencer', label: 'Próximo de vencer', cor: 'var(--caution)', valor: q.proximo_vencer ?? 0 },
  ]
}

/** Frase de uma região no tooltip do chip: o que a pessoa tem lá. */
export function resumoRegiao(
  r: VolumetriaRegiaoDaPessoa, tecnico: boolean,
): string {
  const hosp = `${r.hospitais} ${r.hospitais === 1 ? 'hospital' : 'hospitais'}`
  const carga = `${r.pendencias} ${r.pendencias === 1 ? 'demanda' : 'demandas'}`
  if (!tecnico) return `${r.regiao}: ${hosp} · ${carga}`
  return `${r.regiao}: ${r.pacientes} ${r.pacientes === 1 ? 'paciente' : 'pacientes'} em ${hosp} · ${carga}`
}

/** Hospitais da pessoa agrupados por região, na ordem que o backend já deu. */
export function hospitaisPorRegiao(
  p: VolumetriaPessoa,
): Array<{ regiao: VolumetriaRegiaoDaPessoa; hospitais: VolumetriaHospitalDaPessoa[] }> {
  return p.regioes.map((regiao) => ({
    regiao,
    hospitais: p.hospitais.filter((h) => h.regiao === regiao.regiao),
  }))
}

/** Hospitais distintos com pelo menos uma pessoa do grupo vinculada. */
export function hospitaisCobertos(g: VolumetriaGrupo): number {
  const keys = new Set<string>()
  for (const p of g.pessoas) for (const h of p.hospitais) keys.add(h.hospital_key)
  return keys.size
}

/** Frase dos limiares, para a legenda dizer o que cada cor significa. */
export function descreverLimiares(g: VolumetriaGrupo): string {
  const l = g.parametros.limiares
  const fila = `fila acima de ${fmt1(l.fila_sobrecarga_dias)} dias`
  if (g.role_operacional === 'administrativo') return `Sobrecarga: ${fila}`
  return `Sobrecarga: ${fila} ou prazo acima de ${fmt1(l.pressao_sobrecarga_pct)}%`
}

// ── Dividir a carga de uma pessoa (temporário) ───────────────────────────
// A carga vem dos HOSPITAIS, então dividir é repartir os hospitais da pessoa
// entre ela e os colegas escolhidos, por um período. Cada pessoa enxerga o
// hospital inteiro (o backend não fraciona o compartilhado): quem recebe ganha
// as horas cheias dele, e quem já o cobria não ganha nada.

/** hospital_key → user_id de quem fica com ele no período (a própria pessoa inclusive). */
export type PlanoDivisao = Record<string, string>

/** Hospitais que podem ser repartidos: os PERMANENTES da pessoa. O que ela
 *  recebeu de outra divisão volta para o dono ao fim dela; não se repassa. */
export function hospitaisDivisiveis(p: VolumetriaPessoa): VolumetriaHospitalDaPessoa[] {
  return p.hospitais.filter((h) => !h.temporario)
}

/** Quem pode receber: colegas do grupo COM área definida. Dar um hospital a
 *  quem não tem área a recortaria a ele, em vez de somar trabalho. */
export function colegasParaDividir(g: VolumetriaGrupo, origemId: string): VolumetriaPessoa[] {
  return comVinculo(g).filter((p) => p.user_id !== origemId)
}

/** Repartição sugerida: do hospital mais pesado ao mais leve, cada um vai para
 *  quem tem MENOS horas recebidas nesta divisão (a pessoa começa, então fica
 *  com o mais pesado e nunca sai sem hospital). Hospital sem demanda não pesa
 *  e fica com a pessoa. */
export function repartir(origem: VolumetriaPessoa, participantes: string[]): PlanoDivisao {
  const ids = [origem.user_id, ...participantes.filter((u) => u !== origem.user_id)]
  const soma = new Map(ids.map((u) => [u, 0]))
  const plano: PlanoDivisao = {}
  const ordem = [...hospitaisDivisiveis(origem)].sort((a, b) => b.horas - a.horas)
  for (const h of ordem) {
    if (h.horas <= 0) { plano[h.hospital_key] = origem.user_id; continue }
    let alvo = ids[0]
    for (const u of ids) if ((soma.get(u) ?? 0) < (soma.get(alvo) ?? 0)) alvo = u
    plano[h.hospital_key] = alvo
    soma.set(alvo, (soma.get(alvo) ?? 0) + h.horas)
  }
  return plano
}

export interface PrevisaoParticipante {
  pessoa: VolumetriaPessoa
  hospitais: VolumetriaHospitalDaPessoa[]
  horasAntes: number
  horasDepois: number
  diasAntes: number
  diasDepois: number
  /** Só pela fila: a pressão de prazo depende dos vencimentos caso a caso e
   *  não dá para refazer aqui. É estimativa, e a tela diz isso. */
  nivelDepois: VolumetriaNivel
}

/** Fila de cada participante durante o período, se o plano for aplicado. */
export function preverDivisao(
  g: VolumetriaGrupo, origem: VolumetriaPessoa, participantes: VolumetriaPessoa[], plano: PlanoDivisao,
): PrevisaoParticipante[] {
  const l = g.parametros.limiares
  const nivel = (d: number): VolumetriaNivel =>
    d > l.fila_sobrecarga_dias ? 'sobrecarga' : d > l.fila_atencao_dias ? 'atencao' : 'normal'
  const divisiveis = hospitaisDivisiveis(origem)
  return [origem, ...participantes].map((p) => {
    const cap = p.capacidade_horas_dia > 0 ? p.capacidade_horas_dia : 1
    const meus = divisiveis.filter((h) => (plano[h.hospital_key] ?? origem.user_id) === p.user_id)
    const horasAntes = p.horas ?? 0
    let horasDepois: number
    if (p.user_id === origem.user_id) {
      const saem = divisiveis.filter((h) => !meus.includes(h)).reduce((s, h) => s + h.horas, 0)
      horasDepois = Math.max(0, horasAntes - saem)
    } else {
      const ja = new Set(p.hospitais.map((h) => h.hospital_key))
      horasDepois = horasAntes + meus.filter((h) => !ja.has(h.hospital_key)).reduce((s, h) => s + h.horas, 0)
    }
    return {
      pessoa: p, hospitais: meus, horasAntes, horasDepois,
      diasAntes: p.dias_fila ?? horasAntes / cap,
      diasDepois: horasDepois / cap,
      nivelDepois: nivel(horasDepois / cap),
    }
  })
}

/** Soma a carga de uma lista de hospitais no formato do cartão da pessoa. É a
 *  mesma conta de `_grupo`/`_por_regiao` no backend, feita aqui para a tela
 *  refletir a divisão no clique, sem esperar o recálculo da rede inteira. */
function recontar(
  p: VolumetriaPessoa, hospitais: VolumetriaHospitalDaPessoa[], g: VolumetriaGrupo,
): VolumetriaPessoa {
  const l = g.parametros.limiares
  const quebra: Record<string, number> = {}
  const regioes = new Map<string, VolumetriaRegiaoDaPessoa>()
  let pendencias = 0
  let horas = 0
  for (const h of hospitais) {
    pendencias += h.pendencias
    horas += h.horas
    for (const [k, v] of Object.entries(h.quebra ?? {})) quebra[k] = (quebra[k] ?? 0) + (v ?? 0)
    const r = regioes.get(h.regiao) ?? { regiao: h.regiao, hospitais: 0, pacientes: 0, pendencias: 0, horas: 0 }
    r.hospitais += 1
    r.pacientes += h.internados ?? 0
    r.pendencias += h.pendencias
    r.horas = Math.round((r.horas + h.horas) * 10) / 10
    regioes.set(h.regiao, r)
  }
  const cap = p.capacidade_horas_dia > 0 ? p.capacidade_horas_dia : 1
  const dias = horas / cap
  // Nível só pela fila: a pressão de prazo o backend refaz no refetch.
  const nivel: VolumetriaNivel = dias > l.fila_sobrecarga_dias ? 'sobrecarga' : dias > l.fila_atencao_dias ? 'atencao' : 'normal'
  return {
    ...p,
    hospitais: [...hospitais].sort((a, b) => b.horas - a.horas || b.pendencias - a.pendencias),
    hospitais_n: hospitais.length,
    total_pendencias: pendencias,
    horas: Math.round(horas * 10) / 10,
    dias_fila: dias,
    nivel,
    quebra: quebra as VolumetriaQuebra,
    pacientes: quebra.internados ?? null,
    regioes: [...regioes.values()].sort((a, b) => b.horas - a.horas || b.pacientes - a.pacientes),
  }
}

/** O grupo como fica com a divisão aplicada: os hospitais repassados saem de
 *  quem cedeu e entram em quem recebe (se ela já os cobre, não soma de novo).
 *  Divisão que começa depois de hoje só entra na lista de divisões. */
export function aplicarDivisao(
  g: VolumetriaGrupo, corpo: { de_user_id: string; distribuicao: Record<string, string>; inicio: string; fim: string },
): VolumetriaGrupo {
  const origem = g.pessoas.find((p) => p.user_id === corpo.de_user_id)
  if (!origem) return g
  const vigente = corpo.inicio <= hojeIso()
  const nomeDe = (uid: string) => g.pessoas.find((p) => p.user_id === uid)?.nome ?? 'Outra pessoa'
  const lote = `otimista-${Date.now()}`
  const divisao: VolumetriaDivisao = {
    lote, de_user_id: origem.user_id, de_nome: origem.nome, inicio: corpo.inicio, fim: corpo.fim,
    vigente, criado_por: null,
    itens: Object.entries(corpo.distribuicao).map(([hk, para]) => ({
      hospital_key: hk,
      hospital_nome: origem.hospitais.find((h) => h.hospital_key === hk)?.hospital_nome ?? hk,
      para_user_id: para, para_nome: nomeDe(para),
    })),
  }
  const divisoes = [...(g.divisoes ?? []), divisao]
  if (!vigente) return { ...g, divisoes }

  const saem = new Set(Object.keys(corpo.distribuicao))
  return {
    ...g,
    divisoes,
    pessoas: g.pessoas.map((p) => {
      if (p.user_id === origem.user_id) {
        return recontar(p, p.hospitais.filter((h) => !saem.has(h.hospital_key)), g)
      }
      const ja = new Set(p.hospitais.map((h) => h.hospital_key))
      const recebe = origem.hospitais
        .filter((h) => corpo.distribuicao[h.hospital_key] === p.user_id && !ja.has(h.hospital_key))
        .map((h) => ({
          ...h,
          temporario: { de_user_id: origem.user_id, de_nome: origem.nome, fim: corpo.fim, lote },
        }))
      return recebe.length > 0 ? recontar(p, [...p.hospitais, ...recebe], g) : p
    }),
  }
}

/** "26/09" a partir de "2026-09-26". */
export function fmtDiaMes(iso: string): string {
  const [, m, d] = iso.split('-')
  return d && m ? `${d}/${m}` : iso
}

/** Data de hoje em Brasília, em ISO: é o "hoje" que o backend usa para a divisão. */
export function hojeIso(desloc = 0): string {
  const d = new Date(Date.now() - 3 * 3600_000 + desloc * 86400_000)
  return d.toISOString().slice(0, 10)
}

/** Divisões do grupo que envolvem a pessoa, como quem cedeu. */
export function divisoesDe(g: VolumetriaGrupo, userId: string): VolumetriaDivisao[] {
  return (g.divisoes ?? []).filter((d) => d.de_user_id === userId)
}
