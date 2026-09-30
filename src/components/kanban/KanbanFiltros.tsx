// Barra de priorização do quadro de Tarefas.
//
// Três coisas de natureza diferente, cada uma com seu lugar:
//   * BUSCA, sempre à vista (é o que se usa o tempo todo);
//   * FILTROS (hospital, operadora, recortes clínicos) atrás de um botão, num
//     painel. À vista ficam só os filtros LIGADOS, como etiquetas com X: com
//     tudo exposto no mesmo nível, não dava para saber o que era filtro;
//   * ORDEM, à direita, que não esconde nada, só reordena.
//
// Apresentação pura: recebe o recorte atual e devolve o novo. Quem decide o que
// cada chip significa é `prioridade.ts`. O painel mostra quantos cards cada
// recorte alcança, para o usuário saber o tamanho ANTES de marcar.
import { useEffect, useRef, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { GestorFiltros } from '../../types/api'
import { CHIPS, ORDENS, type ChipKey, type OrdemKey, type Recorte } from './prioridade'

const ICONE_ORDEM = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13M3 12h9M3 18h5" /><path d="m17 15 3 3 3-3M20 6v12" /></svg>
const ICONE_FILTRO = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>

/** Select com seta à direita: o `.bm-input` tira a seta nativa, e sem ela o
 *  select parecia um campo de texto. */
function CampoSelect({ icone, prefixo, children, ...props }: {
  icone?: ReactNode
  prefixo?: string
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="kb-sel">
      {icone && <span className="kb-sel-ico">{icone}</span>}
      {prefixo && <span className="kb-sel-pre">{prefixo}</span>}
      <select {...props}>{children}</select>
      <svg className="kb-sel-seta" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  )
}

export function KanbanFiltros({
  recorte, onChange, contagens, hospitais, operadoras, totalVisivel, totalGeral, censos,
}: {
  recorte: Recorte
  /** Quadro de censos: cards de hospital, sem os sinais clínicos. Sobram a
   *  busca, o hospital e a operadora; chips e ordenação são de paciente. */
  censos?: boolean
  onChange: (r: Recorte) => void
  /** Quantos cards do quadro casam cada chip (antes dos demais filtros). */
  contagens: Record<ChipKey, number>
  hospitais: GestorFiltros['hospitais']
  /** Operadoras do quadro de censos (só lá o filtro aparece). */
  operadoras?: GestorFiltros['operadoras']
  totalVisivel: number
  totalGeral: number
}) {
  const [aberto, setAberto] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora e no Escape, como os demais painéis do sistema.
  useEffect(() => {
    if (!aberto) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); setAberto(false) }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [aberto])

  const chipsAtivos = censos ? [] : recorte.chips
  const nomeHospital = hospitais.find((h) => h.key === recorte.hospital)?.nome ?? recorte.hospital
  const nomeOperadora = (operadoras ?? []).find((o) => o.key === recorte.operadora)?.nome ?? recorte.operadora
  const temOperadora = Boolean(censos && recorte.operadora)
  const nFiltros = (recorte.hospital ? 1 : 0) + (temOperadora ? 1 : 0) + chipsAtivos.length
  // A busca não vira etiqueta (já está escrita no campo), mas também recorta:
  // entra no "X de Y" para o total nunca parecer errado.
  const recortado = nFiltros > 0 || Boolean(recorte.busca)

  function alternarChip(key: ChipKey) {
    const chips = recorte.chips.includes(key)
      ? recorte.chips.filter((c) => c !== key)
      : [...recorte.chips, key]
    onChange({ ...recorte, chips })
  }

  const limparFiltros = () => onChange({ ...recorte, chips: [], hospital: '', operadora: '' })

  return (
    <div className="kb-filtros">
      <div className="kb-filtros-linha">
        <div className="kb-busca-wrap">
          <svg className="kb-busca-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            className="kb-busca"
            placeholder={censos ? 'Buscar hospital…' : 'Buscar paciente, atendimento, leito, médico…'}
            value={recorte.busca}
            onChange={(e) => onChange({ ...recorte, busca: e.target.value })}
          />
          {recorte.busca && (
            <button className="kb-busca-clear" onClick={() => onChange({ ...recorte, busca: '' })} aria-label="Limpar busca" title="Limpar">✕</button>
          )}
        </div>

        <div className="kb-fbtn-wrap" ref={wrapRef}>
          <button
            type="button"
            className={`kb-fbtn${nFiltros ? ' ligado' : ''}${aberto ? ' aberto' : ''}`}
            aria-expanded={aberto}
            aria-haspopup="dialog"
            onClick={() => setAberto((v) => !v)}
          >
            {ICONE_FILTRO}
            Filtros
            {nFiltros > 0 && <span className="kb-fbtn-n">{nFiltros}</span>}
          </button>

          {aberto && (
            <div className="kb-painel" role="dialog" aria-label="Filtros">
              <div className="kb-painel-grupo">
                <span className="form-lbl">Hospital</span>
                <CampoSelect
                  value={recorte.hospital}
                  onChange={(e) => onChange({ ...recorte, hospital: e.target.value })}
                >
                  <option value="">Todos os hospitais</option>
                  {hospitais.map((h) => (
                    <option key={h.key} value={h.key}>{h.nome}</option>
                  ))}
                </CampoSelect>
              </div>

              {censos && (
                <div className="kb-painel-grupo">
                  <span className="form-lbl">Operadora</span>
                  <CampoSelect
                    value={recorte.operadora ?? ''}
                    onChange={(e) => onChange({ ...recorte, operadora: e.target.value })}
                  >
                    <option value="">Todas as operadoras</option>
                    {(operadoras ?? []).map((o) => (
                      <option key={o.key} value={o.key}>{o.nome}</option>
                    ))}
                  </CampoSelect>
                </div>
              )}

              {!censos && (
                <div className="kb-painel-grupo">
                  {/* Os recortes combinam em E: marcar dois mostra quem tem os dois. */}
                  <span className="form-lbl">Mostrar só</span>
                  <div className="kb-opcoes">
                    {CHIPS.map((c) => {
                      const ativo = recorte.chips.includes(c.key)
                      const n = contagens[c.key] ?? 0
                      return (
                        <label
                          key={c.key}
                          className={`kb-opcao${ativo ? ' ativo' : ''}${n === 0 ? ' vazio' : ''}`}
                          title={c.titulo}
                          style={{ ['--kb-chip-cor' as string]: c.cor }}
                        >
                          <input type="checkbox" checked={ativo} onChange={() => alternarChip(c.key)} />
                          <span className="kb-opcao-dot" aria-hidden />
                          <span className="flex-1">{c.label}</span>
                          <span className="kb-opcao-n">{n}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="kb-painel-rodape">
                <button type="button" className="btn btn-ghost btn-sm" disabled={!nFiltros} onClick={limparFiltros}>
                  Limpar filtros
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setAberto(false)}>
                  Pronto
                </button>
              </div>
            </div>
          )}
        </div>

        {!censos && (
          <div className="kb-ordem">
            <CampoSelect
              icone={ICONE_ORDEM}
              prefixo="Ordenar:"
              value={recorte.ordem}
              onChange={(e) => onChange({ ...recorte, ordem: e.target.value as OrdemKey })}
            >
              {ORDENS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </CampoSelect>
          </div>
        )}
      </div>

      {/* Só aparece com algo ligado: um filtro esquecido nunca fica invisível. */}
      {recortado && (
        <div className="kb-ativos">
          {nFiltros > 0 && <span className="kb-ativos-lbl">Filtrando:</span>}
          {recorte.hospital && (
            <Etiqueta onRemover={() => onChange({ ...recorte, hospital: '' })}>Hospital: {nomeHospital}</Etiqueta>
          )}
          {temOperadora && (
            <Etiqueta onRemover={() => onChange({ ...recorte, operadora: '' })}>Operadora: {nomeOperadora}</Etiqueta>
          )}
          {chipsAtivos.map((k) => {
            const c = CHIPS.find((x) => x.key === k)
            return c && (
              <Etiqueta key={k} cor={c.cor} onRemover={() => alternarChip(k)}>{c.label}</Etiqueta>
            )
          })}
          <span className="kb-ativos-fim">
            <span className="kb-filtros-conta">{totalVisivel} de {totalGeral}</span>
            {nFiltros > 0 && (
              <button type="button" className="kb-link" onClick={limparFiltros}>Limpar filtros</button>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

function Etiqueta({ children, cor, onRemover }: { children: ReactNode; cor?: string; onRemover: () => void }) {
  return (
    <span className="kb-tag" style={cor ? { ['--kb-chip-cor' as string]: cor } : undefined}>
      {cor && <span className="kb-opcao-dot" aria-hidden />}
      {children}
      <button type="button" className="kb-tag-x" onClick={onRemover} aria-label="Remover filtro">✕</button>
    </span>
  )
}
