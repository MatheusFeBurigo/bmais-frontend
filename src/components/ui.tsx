// Componentes de UI compartilhados, portados do design system (base.html).
// Reusados pelas telas migradas (Diretoria, Gestor, Equipe, Configurações, Upload).

import type { ReactNode } from 'react'

// ── KPI card ──────────────────────────────────────────────────────────────
type KpiVariant =
  | 'danger' | 'warning' | 'caution' | 'success'
  | 'info' | 'primary-kpi' | 'neutral'

interface KpiCardProps {
  label: string
  value: ReactNode
  meta?: ReactNode
  variant?: KpiVariant
  active?: boolean
  onClick?: () => void
}

export function KpiCard({ label, value, meta, variant = 'neutral', active, onClick }: KpiCardProps) {
  const clickable = onClick != null
  return (
    <div
      className={`kpi ${variant}${clickable ? ' kpi-clickable' : ''}${active ? ' active-filter' : ''}`}
      onClick={onClick}
    >
      <div className="kpi-bar" />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {meta != null && <div className="kpi-meta">{meta}</div>}
    </div>
  )
}

// ── Badge genérico ────────────────────────────────────────────────────────
type BadgeVariant =
  | 'danger' | 'warning' | 'caution' | 'success'
  | 'info' | 'muted' | 'primary-badge'

export function Badge({ variant = 'muted', dot, children }: {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
}) {
  return (
    <span className={`badge ${variant}`}>
      {dot && <span className="bdot" />}
      {children}
    </span>
  )
}

// ── Avatar de operadora ───────────────────────────────────────────────────
const OP_INITIALS: Record<string, string> = {
  sulamerica: 'SU', bradesco: 'BR', careplus: 'CA', itau: 'IT',
  porto: 'PO', allianz: 'AL', mediservic: 'MS', notredame: 'ND',
}

export function opInitial(key: string): string {
  return OP_INITIALS[key] || key.slice(0, 2).toUpperCase()
}

export function OpAvatar({ opKey, size = 26 }: { opKey: string; size?: number }) {
  return (
    <span
      className={`op-av ${opKey}`}
      style={{ width: size, height: size, borderRadius: Math.round(size / 3.7), fontSize: Math.round(size * 0.38) }}
    >
      {opInitial(opKey)}
    </span>
  )
}

// ── Spinner ─────────────────────────────────────────────────────────────────
// Indicador de carregamento reutilizável. `size` é o diâmetro em px; a espessura
// da borda escala junto para manter a proporção em qualquer tamanho.
export function Spinner({ size = 20, className, style }: {
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const border = Math.max(2, Math.round(size / 8))
  return (
    <span
      className={`bm-spinner${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="Carregando"
      style={{ width: size, height: size, borderWidth: border, ...style }}
    />
  )
}

// Estado de carregamento centralizado: spinner + texto opcional. Substitui os
// "Carregando…" soltos, dando um retorno visual consistente entre as telas.
export function LoadingState({ label = 'Carregando…', size = 28, className, style }: {
  label?: ReactNode
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`bm-loading${className ? ` ${className}` : ''}`} style={style}>
      <Spinner size={size} />
      {label != null && <div className="bm-loading-text">{label}</div>}
    </div>
  )
}

// ── Barra de progresso ────────────────────────────────────────────────────
export function ProgressBar({ pct, color = 'var(--success)' }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${clamped}%`, background: color }} />
    </div>
  )
}

// ── Stat mini (número + rótulo compacto) ──────────────────────────────────
export function StatMini({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="kpi" style={{ padding: '12px 14px' }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ fontSize: 'var(--t-2xl)' }}>{value}</div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ maxWidth: 440, width: '90%', margin: '10vh auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ alignItems: 'center' }}>
          <div className="card-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Fechar" type="button">✕</button>
        </div>
        <div className="card-body">{children}</div>
        {footer && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
