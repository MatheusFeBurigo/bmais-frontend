// Constantes, rótulos e derivações da tela de Movimentações (apresentação pura).
import type { AuditLog, AuditoriaUsuario, UserRole } from '../../types/api'
import { dataHora } from '../../lib/datas'
import { ROLE_LABEL, ROLE_VARIANT } from '../../lib/usuarioRoles'

// ── Período ──────────────────────────────────────────────────────────────────
export type Periodo = 'hoje' | '7d' | '30d' | '90d' | 'tudo'

export const PERIODOS: ReadonlyArray<{ key: Periodo; label: string; dias: number | null }> = [
  { key: 'hoje', label: 'Hoje', dias: 1 },
  { key: '7d', label: '7 dias', dias: 7 },
  { key: '30d', label: '30 dias', dias: 30 },
  { key: '90d', label: '90 dias', dias: 90 },
  { key: 'tudo', label: 'Tudo', dias: null },
]

/** Início do período como ISO (UTC) da MEIA-NOITE LOCAL de N-1 dias atrás, para
 *  "hoje"/"7 dias" baterem com o calendário do usuário e não com o UTC do banco.
 *  Vazio = sem limite ("tudo"). */
export function inicioPeriodo(p: Periodo): string {
  const def = PERIODOS.find((x) => x.key === p)
  if (!def || def.dias === null) return ''
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (def.dias - 1))
  return d.toISOString()
}

export function labelPeriodo(p: Periodo): string {
  return PERIODOS.find((x) => x.key === p)?.label ?? p
}

// ── Entidades (famílias de ação) ─────────────────────────────────────────────
type BadgeVariant = 'danger' | 'warning' | 'caution' | 'success' | 'info' | 'muted' | 'primary-badge'

export const ENTIDADE_LABEL: Record<string, string> = {
  relatorio: 'Relatório',
  paciente: 'Paciente',
  censo: 'Censo',
  hospital: 'Hospital',
  operadora: 'Operadora',
  convenio: 'Convênio',
  profissional: 'Equipe',
  escala: 'Escala',
  usuario: 'Usuário',
  sessao: 'Sessão',
  kanban: 'Tarefa',
  sistema: 'Sistema',
  outro: 'Outro',
}

export const ENTIDADE_VARIANT: Record<string, BadgeVariant> = {
  relatorio: 'info',
  paciente: 'primary-badge',
  censo: 'success',
  hospital: 'caution',
  operadora: 'caution',
  convenio: 'caution',
  profissional: 'muted',
  escala: 'muted',
  usuario: 'danger',
  sessao: 'muted',
  kanban: 'warning',
  sistema: 'danger',
  outro: 'muted',
}

export function entidadeLabel(key: string | null | undefined): string {
  return (key && ENTIDADE_LABEL[key]) || key || '—'
}

export function entidadeVariant(key: string | null | undefined): BadgeVariant {
  return (key && ENTIDADE_VARIANT[key]) || 'muted'
}

// Entidades que contam como "cadastros" (clientes e equipe) no painel de usuários.
export const ENTIDADES_CADASTRO = ['hospital', 'operadora', 'convenio', 'profissional', 'escala'] as const

export function contarCadastros(porEntidade: Record<string, number> | undefined): number {
  if (!porEntidade) return 0
  return ENTIDADES_CADASTRO.reduce((n, e) => n + (porEntidade[e] ?? 0), 0)
}

// ── Papel ────────────────────────────────────────────────────────────────────
const ROLES: ReadonlySet<string> = new Set<UserRole>(['admin', 'diretor', 'gestor', 'administrativo', 'tecnico', 'analista'])

export function roleLabel(role: string | null | undefined): string {
  if (!role) return '—'
  return ROLES.has(role) ? ROLE_LABEL[role as UserRole] : role
}

export function roleVariant(role: string | null | undefined): BadgeVariant {
  if (!role || !ROLES.has(role)) return 'muted'
  return ROLE_VARIANT[role as UserRole]
}

// ── Tempo ────────────────────────────────────────────────────────────────────
/** "agora", "há 5 min", "há 3 h" (mesmo dia) ou data/hora completa. */
export function tempoRelativo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const min = Math.round((Date.now() - t) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return dataHora(iso)
}

// ── Usuário ──────────────────────────────────────────────────────────────────
/** O ALVO da ação em uma frase curta: o paciente, o arquivo de censo, o
 *  hospital. É o "o quê" que acompanha o "quem" na linha da trilha — o resumo já
 *  traz isso no texto, mas destacado a leitura fica imediata (e o mesmo dado
 *  alimenta a busca livre). Vazio quando não há alvo de negócio. */
export function alvoDaAcao(log: Pick<AuditLog, 'detalhes' | 'entidade'>): string {
  const d = log.detalhes ?? {}
  const txt = (v: unknown): string => (typeof v === 'string' && v.trim() ? v.trim() : '')
  // Paciente (relatório, edição de ficha, observação, cadastro manual).
  const paciente = txt(d.paciente)
  if (paciente) {
    const hosp = txt(d.hospital)
    return hosp ? `${paciente} · ${hosp}` : paciente
  }
  // Censo: os arquivos enviados/processados.
  const arquivos = d.arquivos
  if (Array.isArray(arquivos) && arquivos.length > 0) {
    const nomes = arquivos
      .map((a) => (typeof a === 'string' ? a : txt((a as Record<string, unknown>)?.arquivo)))
      .filter(Boolean)
    if (nomes.length > 0) {
      return nomes.length === 1 ? nomes[0] : `${nomes[0]} +${nomes.length - 1}`
    }
  }
  // Cadastros e contas.
  return txt(d.nome) || txt(d.hospital) || txt(d.email) || ''
}

/** Nome de exibição de quem agiu: nome > e-mail > id > "sistema". */
export function nomeDoAutor(log: Pick<AuditLog, 'user_nome' | 'user_email' | 'user_id'>): string {
  return log.user_nome || log.user_email || log.user_id || 'sistema'
}

export function nomeDoUsuario(u: Pick<AuditoriaUsuario, 'nome' | 'email' | 'user_id'>): string {
  return u.nome || u.email || u.user_id || '—'
}

/** Iniciais para o avatar (2 letras), como no rodapé da Sidebar. */
export function iniciais(nome: string): string {
  const base = (nome || '').split('@')[0].trim()
  if (!base) return '?'
  const partes = base.split(/[\s._-]+/).filter(Boolean)
  const letras = partes.length >= 2 ? partes[0][0] + partes[1][0] : base.slice(0, 2)
  return letras.toUpperCase()
}
