// Barra de filtros do Gestor (apresentação pura): pills de operadora no topo +
// chips de filtros ativos removíveis. Extraída de pages/Gestor.tsx.
// A página deriva os dados (operadoras, chips) e passa prontos.
import { opCor } from '../ui'

export interface ChipFiltro { tipo: string; label: string; onRemove: () => void }

// Pills de operadora (filtro GLOBAL — refaz a busca). "Todas" = neutro escuro.
export function OperadoraPills({ operadoras, ativa, onSelecionar }: {
  operadoras: Array<{ key: string; nome: string }>
  ativa: string
  onSelecionar: (key: string) => void
}) {
  if (operadoras.length === 0) return null
  return (
    <div className="gestor-topbar">
      <span className="topbar-lbl">Operadora</span>
      <div className="op-pills">
        <button type="button" className={`pill-op${!ativa ? ' active-neutra' : ''}`}
          onClick={() => onSelecionar('')}>Todas</button>
        {operadoras.map((o) => (
          <button key={o.key} type="button"
            className={`pill-op pill-op-cor${ativa === o.key ? ' active' : ''}`}
            style={{ ['--op-cor' as string]: opCor(o.key) }}
            onClick={() => onSelecionar(o.key)}>
            <span className="pill-op-dot" />
            {o.nome}
          </button>
        ))}
      </div>
    </div>
  )
}

// Chips removíveis dos recortes ativos (operadora/hospital/região/faixa/dia) +
// "Limpar tudo". Só aparece quando há algum filtro aplicado.
export function ChipsAtivos({ chips, onLimparTudo }: {
  chips: ChipFiltro[]
  onLimparTudo: () => void
}) {
  if (chips.length === 0) return null
  return (
    <div className="filtros-ativos">
      <span className="filtros-ativos-lbl">Filtros ativos</span>
      {chips.map((c) => (
        <button key={c.tipo} type="button" className="filtro-chip" onClick={c.onRemove} title={`Remover ${c.tipo}`}>
          <span className="filtro-chip-tipo">{c.tipo}:</span> {c.label}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ))}
      <button type="button" className="btn btn-ghost btn-sm filtros-limpar" onClick={onLimparTudo}>
        Limpar tudo
      </button>
    </div>
  )
}
