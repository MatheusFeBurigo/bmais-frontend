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
