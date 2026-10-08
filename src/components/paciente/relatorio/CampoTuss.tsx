// Campo de procedimento (catálogo TUSS, 0054): digita código ou nome e escolhe
// na lista, com os mais usados no Márcia primeiro. Valor fechado: só vale o que
// foi escolhido na lista (o backend recusa código fora do catálogo).
//
// `digitando` evita o bug do HospitalCombobox (memo de 12/09): ao digitar, a
// escolha é desfeita, e o efeito que sincroniza texto e valor não pode apagar
// a letra recém-digitada.
import { useEffect, useRef, useState } from 'react'
import { useTussBusca } from '../../../hooks/useTuss'
import type { ProcedimentoTuss } from '../../../types/api'

const estilos = `
.tuss-wrap{position:relative;min-width:0}
.tuss-menu{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 28px rgba(6,46,92,.14);max-height:240px;overflow-y:auto;overscroll-behavior:contain;padding:4px;min-width:320px}
.tuss-opt{display:flex;gap:10px;align-items:baseline;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.tuss-opt.ativo{background:var(--primary-soft);color:var(--primary)}
.tuss-cod{font-family:var(--font-mono);font-weight:700;flex-shrink:0}
.tuss-vazio{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
`

const texto = (p: { codigo: string; nome: string } | null) => (p?.codigo ? `${p.codigo} ${p.nome}` : '')

export function CampoTuss({ valor, onEscolher, desabilitado }: {
  /** O procedimento escolhido (código vazio = nenhum). */
  valor: { codigo: string; nome: string }
  onEscolher: (p: ProcedimentoTuss | null) => void
  desabilitado?: boolean
}) {
  const [txt, setTxt] = useState(texto(valor))
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const digitando = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Sem escolha, o texto é a busca; com escolha, a busca começa vazia.
  const busca = useTussBusca(valor.codigo ? '' : txt, aberto)

  useEffect(() => {
    if (digitando.current) return
    setTxt(texto(valor))
  }, [valor.codigo, valor.nome]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aberto) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [aberto])

  function escolher(p: ProcedimentoTuss) {
    digitando.current = false
    onEscolher(p)
    setTxt(texto(p))
    setAberto(false)
    setAtivo(0)
  }

  function onKey(e: React.KeyboardEvent) {
    const opcoes = busca.itens
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, Math.max(opcoes.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto) {
      e.preventDefault()
      if (!busca.carregando && opcoes[ativo]) escolher(opcoes[ativo])
    } else if (e.key === 'Escape' && aberto) {
      // Só fecha a lista: sem isto o Escape fecharia a modal.
      e.stopPropagation()
      setAberto(false)
    }
  }

  return (
    <div className="tuss-wrap" ref={wrapRef}>
      <style>{estilos}</style>
      <input
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
        className="bm-input bm-select"
        placeholder="Código ou nome"
        autoComplete="off"
        value={txt}
        disabled={desabilitado}
        onChange={(e) => {
          digitando.current = true
          setTxt(e.target.value)
          if (valor.codigo) onEscolher(null)
          setAberto(true)
          setAtivo(0)
        }}
        onFocus={() => setAberto(true)}
        onClick={() => setAberto(true)}
        onBlur={() => {
          digitando.current = false
          if (!valor.codigo) setTxt('')
        }}
        onKeyDown={onKey}
      />
      {aberto && (
        <div className="tuss-menu" role="listbox">
          {busca.itens.map((p, i) => (
            <div
              key={p.codigo}
              role="option"
              aria-selected={i === ativo}
              className={`tuss-opt${i === ativo ? ' ativo' : ''}`}
              onMouseEnter={() => setAtivo(i)}
              onMouseDown={(e) => { e.preventDefault(); escolher(p) }}
            >
              <span className="tuss-cod">{p.codigo}</span>
              <span>{p.nome}</span>
            </div>
          ))}
          {busca.carregando && busca.itens.length === 0 && <div className="tuss-vazio">Buscando…</div>}
          {!busca.carregando && busca.itens.length === 0 && <div className="tuss-vazio">Nenhum procedimento encontrado</div>}
        </div>
      )}
    </div>
  )
}
