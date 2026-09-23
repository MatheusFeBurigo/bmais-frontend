// Barra de priorização do Kanban: busca, chips de urgência, hospital e ordenação.
//
// Apresentação pura: recebe o recorte atual e devolve o novo. Quem decide o que
// cada chip significa é `prioridade.ts`; aqui só se desenha o controle e se mostra
// quantos cards ele alcança, para o usuário saber o tamanho do recorte ANTES de
// clicar (um chip que levaria a zero cards fica visivelmente vazio).
import type { GestorFiltros } from '../../types/api'
import { CHIPS, ORDENS, type ChipKey, type OrdemKey, type Recorte } from './prioridade'

export function KanbanFiltros({ recorte, onChange, contagens, hospitais, totalVisivel, totalGeral }: {
  recorte: Recorte
  onChange: (r: Recorte) => void
  /** Quantos cards do quadro casam cada chip (antes dos demais filtros). */
  contagens: Record<ChipKey, number>
  hospitais: GestorFiltros['hospitais']
  totalVisivel: number
  totalGeral: number
}) {
  // Um filtro ativo é algo que o usuário pode ter esquecido de desligar; com a
  // contagem ao lado e o "limpar" à mão, o recorte nunca fica invisível.
  const temFiltro = Boolean(recorte.busca || recorte.chips.length || recorte.hospital)

  function alternarChip(key: ChipKey) {
    const chips = recorte.chips.includes(key)
      ? recorte.chips.filter((c) => c !== key)
      : [...recorte.chips, key]
    onChange({ ...recorte, chips })
  }

  return (
    <div className="kb-filtros">
      <div className="kb-filtros-linha">
        <div className="kb-busca-wrap">
          <svg className="kb-busca-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            className="bm-input"
            style={{ paddingLeft: 32, width: 300 }}
            placeholder="Paciente, atendimento, leito, médico, convênio…"
            value={recorte.busca}
            onChange={(e) => onChange({ ...recorte, busca: e.target.value })}
          />
          {recorte.busca && (
            <button className="kb-busca-clear" onClick={() => onChange({ ...recorte, busca: '' })} aria-label="Limpar busca" title="Limpar">✕</button>
          )}
        </div>

        <select
          className="bm-input kb-filtro-select"
          value={recorte.hospital}
          onChange={(e) => onChange({ ...recorte, hospital: e.target.value })}
          title="Mostrar só os pacientes de um hospital"
        >
          <option value="">Todos os hospitais</option>
          {hospitais.map((h) => (
            <option key={h.key} value={h.key}>{h.nome}</option>
          ))}
        </select>

        <label className="kb-ordem">
          <span className="kb-ordem-lbl">Ordenar por</span>
          <select
            className="bm-input kb-filtro-select"
            value={recorte.ordem}
            onChange={(e) => onChange({ ...recorte, ordem: e.target.value as OrdemKey })}
          >
            {ORDENS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </label>

        {temFiltro && (
          <>
            <span className="kb-filtros-conta">
              {totalVisivel} de {totalGeral}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onChange({ ...recorte, busca: '', chips: [], hospital: '' })}
            >
              Limpar filtros
            </button>
          </>
        )}
      </div>

      <div className="kb-chips">
        {CHIPS.map((c) => {
          const ativo = recorte.chips.includes(c.key)
          const n = contagens[c.key] ?? 0
          return (
            <button
              key={c.key}
              type="button"
              title={c.titulo}
              aria-pressed={ativo}
              className={`kb-chip${ativo ? ' ativo' : ''}${n === 0 ? ' vazio' : ''}`}
              style={{ ['--kb-chip-cor' as string]: c.cor, ['--kb-chip-bg' as string]: c.corBg }}
              onClick={() => alternarChip(c.key)}
            >
              <span className="kb-chip-dot" aria-hidden />
              {c.label}
              <span className="kb-chip-n">{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
