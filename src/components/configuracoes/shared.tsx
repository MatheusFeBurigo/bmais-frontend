// Componentes de apresentação compartilhados da tela Configurações.
// Extraídos de pages/Configuracoes.tsx.
import type React from 'react'

// Seta do accordion (rotaciona via CSS quando o item está aberto).
export function ChevronRight() {
  return (
    <svg className="op-acc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function StatMini({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="stat-mini">
      <div className="stat-mini-val" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-mini-label">{label}</div>
    </div>
  )
}

export function NumField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="config-field">
      <label>{label}</label>
      <div className="cfg-num-wrap">
        <input type="number" className="cfg-num-field" value={value} min={0} onChange={(e) => onChange(parseInt(e.target.value) || 0)} />
        <div className="cfg-num-suffix">dias</div>
      </div>
      {hint && <div className="config-hint">{hint}</div>}
    </div>
  )
}
