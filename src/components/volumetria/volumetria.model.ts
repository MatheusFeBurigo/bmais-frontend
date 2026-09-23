// Regras compartilhadas da tela Volumetria. Gráfico, lista e painel leem daqui
// para rótulo e cor de cada nível serem os MESMOS nos três lugares.
//
// O nível em si (normal/atenção/sobrecarga) vem do backend (domain/carga.py):
// é calculado em horas contra a capacidade da pessoa, com limiares absolutos.
// Aqui só se apresenta.
import type {
  UserRole, VolumetriaGrupo, VolumetriaHospitalDaPessoa, VolumetriaNivel, VolumetriaPessoa,
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

export function maxHoras(g: VolumetriaGrupo): number {
  return Math.max(0, ...g.pessoas.map((p) => p.horas ?? 0))
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
    const c = colunaKanban('cobrancas')
    const atraso = q.maior_atraso ?? 0
    return [{
      key: 'sem_censo', label: c?.titulo ?? 'Cobrar censo', cor: c?.cor ?? 'var(--primary)',
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
  const carga = `${r.pendencias} ${r.pendencias === 1 ? 'demanda' : 'demandas'} · ${fmtHoras(r.horas)}`
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
