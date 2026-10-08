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

export function NumField({ label, value, onChange, hint, min = 0, max, erro }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
  min?: number; max?: number
  /** Pinta a dica de vermelho: o valor não pode ser salvo. */
  erro?: boolean
}) {
  return (
    <div className="config-field">
      <label>{label}</label>
      <div className="cfg-num-wrap">
        <input type="number" className="cfg-num-field" value={value} min={min} max={max} onChange={(e) => onChange(parseInt(e.target.value) || 0)} />
        <div className="cfg-num-suffix">dias</div>
      </div>
      {hint && <div className="config-hint" style={erro ? { color: 'var(--danger)' } : undefined}>{hint}</div>}
    </div>
  )
}

// "Censo a cada N dias". O backend guarda a tolerância, N - 1 (censo_tolerancia_dias:
// 0 = todo dia), e aceita até 30, ou seja, um censo a cada 31 dias.
const CENSO_MAX_DIAS = 31

export function censoIntervaloValido(tolerancia: number): boolean {
  return tolerancia >= 0 && tolerancia < CENSO_MAX_DIAS
}

export function censoIntervaloTexto(tolerancia: number): string {
  return tolerancia > 0 ? `a cada ${tolerancia + 1} dias` : 'todo dia'
}

export function CensoIntervaloField({ tolerancia, onChange, hint }: {
  tolerancia: number; onChange: (tolerancia: number) => void; hint?: string
}) {
  // Sem travar no mínimo ao digitar: apagar o "1" para escrever "5" viraria "15".
  // O campo vazio fica inválido e segura o Salvar até ter um número.
  const valido = censoIntervaloValido(tolerancia)
  return (
    <NumField label="Censo a cada" value={tolerancia + 1} min={1} max={CENSO_MAX_DIAS}
      onChange={(v) => onChange(v - 1)}
      hint={valido ? hint : `De 1 a ${CENSO_MAX_DIAS} dias.`} erro={!valido} />
  )
}
