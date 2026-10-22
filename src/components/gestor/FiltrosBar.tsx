// Barra de filtros do Gestor (apresentação pura): pills de operadora e seletor
// de hospital no topo + chips de filtros ativos removíveis. Extraída de
// pages/Gestor.tsx.
// A página deriva os dados (operadoras, chips) e passa prontos.
import { HospitalCombobox } from '../HospitalCombobox'
import { opCor } from '../ui'

export interface ChipFiltro { tipo: string; label: string; onRemove: () => void }

// Pills de operadora (filtro GLOBAL — refaz a busca). "Todas" = neutro escuro.
//
// Ao lado, o hospital (21/10/2026: "filtrar, além da Operadora, também 1
// hospital individualmente"). O recorte já existia pelo clique na barra do
// gráfico "Internados por hospital"; o seletor deixa ele à vista. Com operadora
// escolhida, lista só os hospitais dela (a operadora de cada internação no
// painel é a do hospital, ver carregar_para_gestor). Desde 22/10/2026 é um
// campo de busca só com o nome do hospital ("não precisa exibir a operadora
// (...) permita a pesquisa"). Opcional: a réplica da Ajuda mostra só as pills.
export function OperadoraPills({ operadoras, ativa, onSelecionar, hospital }: {
  operadoras: Array<{ key: string; nome: string }>
  ativa: string
  onSelecionar: (key: string) => void
  hospital?: {
    opcoes: Array<{ key: string; nome: string; operadora_key?: string }>
    ativo: string
    onSelecionar: (key: string) => void
  }
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
      {hospital && <HospitalSelect {...hospital} operadora={ativa} />}
    </div>
  )
}

function HospitalSelect({ opcoes, ativo, onSelecionar, operadora }: {
  opcoes: Array<{ key: string; nome: string; operadora_key?: string }>
  ativo: string
  onSelecionar: (key: string) => void
  operadora: string
}) {
  const daOperadora = operadora ? opcoes.filter((h) => h.operadora_key === operadora) : opcoes
  return (
    <div className="topbar-hosp">
      <span className="topbar-lbl">Hospital</span>
      <div className="topbar-hosp-campo">
        <HospitalCombobox
          hospitais={daOperadora}
          value={ativo}
          // Digitar limpa a escolha a cada tecla; só muda o filtro (e refaz a
          // busca do painel) quando o hospital de fato muda.
          onChange={(key) => { if (key !== ativo) onSelecionar(key) }}
          disabled={daOperadora.length === 0}
          placeholder="Todos os hospitais · digite para buscar"
          sugerirCadastro={false}
        />
        {ativo && (
          <button type="button" className="topbar-hosp-limpar" onClick={() => onSelecionar('')}
                  title="Ver todos os hospitais" aria-label="Ver todos os hospitais">
            ×
          </button>
        )}
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
