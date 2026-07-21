// Mapeamento de status_relatorio para badge e classe de linha, espelhando
// as macros sr_badge / sr_row do dashboard.html.

const BADGE: Record<string, { cls: string; label: string; dot: boolean }> = {
  SEM_RELATORIO: { cls: 'danger', label: 'Sem Rel.', dot: true },
  VENCIDO: { cls: 'warning', label: 'Vencido', dot: true },
  PROXIMO_VENCER: { cls: 'caution', label: 'Próx. Vencer', dot: true },
  EM_DIA: { cls: 'success', label: 'Em Dia', dot: true },
  AGUARDANDO: { cls: 'info', label: 'Aguardando', dot: true },
  ALTA_SEM_REL: { cls: 'danger', label: 'Alta s/Rel', dot: true },
  ALTA_REL_VENCIDO: { cls: 'warning', label: 'Alta Venc.', dot: true },
  ALTA_OK: { cls: 'success', label: 'Alta OK', dot: true },
  ALTA_AUTO: { cls: 'muted', label: 'Alta Auto?', dot: false },
}

export function StatusBadge({ sr }: { sr: string }) {
  const b = BADGE[sr]
  if (!b) return <span className="badge muted">{sr}</span>
  return (
    <span className={`badge ${b.cls}`}>
      {b.dot && <span className="bdot" />}
      {b.label}
    </span>
  )
}

export function rowFlagClass(sr: string): string {
  if (sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL') return 'flag-danger'
  if (sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO') return 'flag-warning'
  if (sr === 'PROXIMO_VENCER') return 'flag-caution'
  if (sr === 'EM_DIA' || sr === 'ALTA_OK') return 'flag-success'
  return ''
}

export function LeitoTag({ tipo }: { tipo?: string | null }) {
  if (tipo === 'UTI') return <span className="leito UTI">UTI</span>
  if (tipo === 'APARTAMENTO') return <span className="leito APARTAMENTO">APT</span>
  if (tipo === 'ENFERMARIA') return <span className="leito ENFERMARIA">ENF</span>
  return <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted-2)' }}>—</span>
}

// ── Cor por papel de quem registrou um relatório ─────────────────────────────
// A timeline colore cada relatório pelo PAPEL do usuário que o adicionou. Cada
// papel tem uma cor sólida (dot/borda) e um fundo suave (chip), reaproveitando
// as variáveis do design-system. Papel ausente/desconhecido = neutro.
export interface RoleVisual {
  label: string
  color: string
  bg: string
}

const ROLE_VISUAL: Record<string, RoleVisual> = {
  admin: { label: 'Admin', color: 'var(--accent-2)', bg: 'var(--accent-soft)' },
  diretor: { label: 'Diretor', color: 'var(--info)', bg: 'var(--info-bg)' },
  gestor: { label: 'Gestor', color: 'var(--caution)', bg: 'var(--caution-bg)' },
  analista: { label: 'Analista', color: 'var(--success)', bg: 'var(--success-bg)' },
}

const ROLE_DESCONHECIDO: RoleVisual = {
  label: 'Desconhecido', color: 'var(--muted-2)', bg: 'var(--surface-3)',
}

export function roleVisual(role?: string | null): RoleVisual {
  if (!role) return ROLE_DESCONHECIDO
  return ROLE_VISUAL[role] || { label: role, color: 'var(--muted-2)', bg: 'var(--surface-3)' }
}

/** Chip do autor de um relatório, colorido pelo papel. */
export function AutorChip({ role, autor }: { role?: string | null; autor?: string | null }) {
  const v = roleVisual(role)
  return (
    <span
      className="badge"
      style={{ background: v.bg, color: v.color, textTransform: 'none', letterSpacing: 0, gap: 5 }}
      title={autor ? `${v.label} · ${autor}` : v.label}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
      {v.label}
    </span>
  )
}
