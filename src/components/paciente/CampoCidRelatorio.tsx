// Campo "CID" do formulário de relatório. Opcional.
//
// Um campo só, que abre uma lista: primeiro os CIDs que o paciente JÁ tem, depois
// o catálogo CID-10 inteiro (para quem pode atribuir CID: técnico e admin). O CID
// escolhido que o paciente ainda não tem é vinculado a ele junto com o relatório,
// no backend (`cids_do_relatorio`). Os demais papéis só escolhem entre os do
// paciente, como antes.
//
// Escolher NÃO grava nada: o CID vira uma etiqueta e só vai com o relatório.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCidBusca, useListaCidsPaciente } from '../../hooks/useCid'
import { useAuth } from '../../auth/AuthContext'
import { podeExecutar } from '../../auth/permissions'
import type { CidEscolhido, FormRelatorio } from './useFormRelatorio'

const estilos = `
.ccr-wrap{position:relative}
.ccr-menu{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 28px rgba(6,46,92,.14);max-height:260px;overflow-y:auto;overscroll-behavior:contain;padding:4px}
.ccr-grupo{padding:8px 10px 4px;font-size:var(--t-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted-2)}
.ccr-opt{display:flex;gap:10px;align-items:baseline;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.ccr-opt.ativo{background:var(--primary-soft);color:var(--primary)}
.ccr-cod{font-family:var(--font-mono);font-weight:700;min-width:48px;flex-shrink:0}
.ccr-vazio{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
.ccr-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.ccr-tag{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:3px 4px 3px 8px;border:1px solid var(--border-strong);border-radius:7px;background:var(--surface);font-size:var(--t-sm);color:var(--ink-2)}
.ccr-tag b{font-family:var(--font-mono);color:var(--primary)}
.ccr-tag-txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ccr-novo{font-size:var(--t-xs);font-weight:600;color:var(--info);background:var(--info-bg);border-radius:4px;padding:1px 5px;flex-shrink:0}
.ccr-x{all:unset;display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;font-size:10px;color:var(--muted);cursor:pointer;flex-shrink:0}
.ccr-x:hover{background:var(--surface-3);color:var(--ink)}
.ccr-x:focus-visible{outline:2px solid var(--accent)}
`

/** Onde o campo guarda o que foi escolhido. Sem ela, nos CIDs do formulário
 *  (o drawer e o "Diagnóstico secundário" da modal). */
export interface SelecaoCid {
  escolhidos: CidEscolhido[]
  adicionar: (c: CidEscolhido) => void
  remover: (codigo: string) => void
  /** Códigos escolhidos no OUTRO campo, que não aparecem na lista deste. */
  ocultar?: string[]
}

export function CampoCidRelatorio({ form, rotulo = 'CID', selecao }: {
  form: FormRelatorio
  rotulo?: string
  selecao?: SelecaoCid
}) {
  const sel: SelecaoCid = selecao ?? {
    escolhidos: form.cids, adicionar: form.adicionarCid, remover: form.removerCid,
  }
  const { role } = useAuth()
  const podeNovo = podeExecutar(role, 'atribuirCid')
  const doPaciente = useListaCidsPaciente(form.internacaoId).data?.cids
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const busca = useCidBusca(texto, aberto && podeNovo)

  const escolhidos = useMemo(
    () => new Set([...sel.escolhidos.map((c) => c.codigo), ...(sel.ocultar ?? [])]),
    [sel.escolhidos, sel.ocultar],
  )
  const doPacienteSet = useMemo(() => new Set((doPaciente ?? []).map((c) => c.codigo)), [doPaciente])

  // Os do paciente vêm primeiro e filtrados pelo texto aqui mesmo (são poucos);
  // o catálogo vem do backend, sem repetir os que já apareceram em cima.
  const termo = texto.trim().toLowerCase().replace('.', '')
  const sugeridos = (doPaciente ?? [])
    .filter((c) => !escolhidos.has(c.codigo))
    .filter((c) => !termo || c.codigo.toLowerCase().replace('.', '').startsWith(termo)
      || (c.descricao ?? '').toLowerCase().includes(termo))
    .map((c) => ({ codigo: c.codigo, descricao: c.descricao ?? '' }))
  const catalogo = podeNovo
    ? busca.itens.filter((c) => !escolhidos.has(c.codigo) && !doPacienteSet.has(c.codigo))
    : []
  const opcoes: CidEscolhido[] = [...sugeridos, ...catalogo.map((c) => ({ codigo: c.codigo, descricao: c.descricao }))]

  useEffect(() => {
    if (!aberto) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [aberto])

  function escolher(c: CidEscolhido) {
    sel.adicionar(c)
    setTexto('')
    setAtivo(0)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, Math.max(opcoes.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto) {
      e.preventDefault()
      // Com a busca em curso a lista ainda é a anterior: esperar evita escolher
      // um CID que não é o que foi digitado.
      if (!busca.carregando && opcoes[ativo]) escolher(opcoes[ativo])
    } else if (e.key === 'Escape' && aberto) {
      // Só fecha a lista: sem isto o Escape fecharia o drawer inteiro.
      e.stopPropagation()
      setAberto(false)
    }
  }

  function aoRolar(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) busca.carregarMais()
  }

  const semOpcoes = !podeNovo && (doPaciente?.length ?? 0) === 0

  return (
    <div>
      <style>{estilos}</style>
      <span className="form-lbl">
        {rotulo} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>(opcional)</span>
      </span>
      {semOpcoes ? (
        <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Nenhum CID cadastrado no paciente.</div>
      ) : (
        <div className="ccr-wrap" ref={wrapRef}>
          <input
            type="text"
            role="combobox"
            aria-expanded={aberto}
            aria-autocomplete="list"
            className="bm-input bm-select"
            placeholder={podeNovo ? 'Código (ex.: J18.9) ou nome da doença' : 'Escolher entre os CIDs do paciente'}
            autoComplete="off"
            value={texto}
            disabled={form.salvando}
            onChange={(e) => { setTexto(e.target.value); setAberto(true); setAtivo(0) }}
            onFocus={() => setAberto(true)}
            onClick={() => setAberto(true)}
            onKeyDown={onKey}
          />
          {aberto && (
            <div className="ccr-menu" role="listbox" onScroll={aoRolar}>
              {sugeridos.length > 0 && <div className="ccr-grupo">Do paciente</div>}
              {opcoes.map((c, i) => (
                <div key={c.codigo}>
                  {podeNovo && i === sugeridos.length && <div className="ccr-grupo">Catálogo CID-10</div>}
                  <div
                    role="option"
                    aria-selected={i === ativo}
                    className={`ccr-opt${i === ativo ? ' ativo' : ''}`}
                    onMouseEnter={() => setAtivo(i)}
                    onMouseDown={(e) => { e.preventDefault(); escolher(c) }}
                  >
                    <span className="ccr-cod">{c.codigo}</span>
                    <span>{c.descricao}</span>
                  </div>
                </div>
              ))}
              {podeNovo && busca.carregando && catalogo.length === 0 && <div className="ccr-vazio">Buscando…</div>}
              {!busca.carregando && opcoes.length === 0 && <div className="ccr-vazio">Nenhum CID encontrado</div>}
              {busca.carregandoMais && <div className="ccr-vazio">Carregando mais…</div>}
            </div>
          )}
        </div>
      )}

      {sel.escolhidos.length > 0 && (
        <div className="ccr-tags">
          {sel.escolhidos.map((c) => (
            <span key={c.codigo} className="ccr-tag" title={`${c.codigo} ${c.descricao}`}>
              <b>{c.codigo}</b>
              <span className="ccr-tag-txt">{c.descricao}</span>
              {/* Avisa que o CID entra também no paciente ao registrar. */}
              {doPaciente && !doPacienteSet.has(c.codigo) && <span className="ccr-novo">Novo no paciente</span>}
              <button type="button" className="ccr-x" aria-label={`Tirar CID ${c.codigo}`} disabled={form.salvando}
                onClick={() => sel.remover(c.codigo)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
