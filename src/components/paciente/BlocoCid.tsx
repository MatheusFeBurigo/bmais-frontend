// Bloco "CID" do drawer: mostra o CID do paciente e, para o técnico, o campo de
// atribuição. Digitar o código completo ("J189", "J18.9") já traz nome, categoria,
// grupo e capítulo do catálogo CID-10; digitar palavras ("pneumonia") lista as
// sugestões. A gravação confere o código de novo no backend.
import { useEffect, useRef, useState } from 'react'
import { dataHora } from '../../lib/datas'
import { normalizarCid, sexoConflita } from '../../lib/cid'
import { useCidBusca, useCidDetalhe, useCidPaciente } from '../../hooks/useCid'
import type { Cid, InternacaoDados } from '../../types/api'

const estilos = `
.cid-wrap{position:relative}
.cid-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md,8px);box-shadow:0 8px 24px rgba(6,46,92,.12);max-height:240px;overflow-y:auto;padding:4px}
.cid-opt{display:flex;gap:10px;align-items:baseline;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.cid-opt:hover,.cid-opt.active{background:var(--primary-soft);color:var(--primary)}
.cid-opt-cod{font-family:var(--font-mono);font-weight:600;min-width:46px;flex-shrink:0}
.cid-vazio{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
.cid-cod{font-family:var(--font-mono);font-weight:700;color:var(--primary);margin-right:8px}
.cid-hier{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin-top:8px;font-size:var(--t-xs);color:var(--muted)}
.cid-hier b{font-weight:600;color:var(--ink-2)}
.cid-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cid-tags .badge{text-transform:none;letter-spacing:0}
`

function Detalhe({ cid, sexoPaciente }: { cid: Cid; sexoPaciente?: string | null }) {
  const conflito = sexoConflita(cid.restricao_sexo, sexoPaciente)
  return (
    <>
      <div className="cid-hier">
        {cid.tipo === 'subcategoria' && (
          <><span>Categoria</span><span><b>{cid.categoria}</b> {cid.categoria_descricao}</span></>
        )}
        {cid.grupo && <><span>Grupo</span><span><b>{cid.grupo}</b> {cid.grupo_descricao}</span></>}
        {cid.capitulo_romano && (
          <><span>Capítulo</span><span><b>{cid.capitulo_romano}</b> {cid.capitulo_descricao}</span></>
        )}
      </div>
      {(cid.restricao_sexo || cid.classificacao || cid.causa_obito === false) && (
        <div className="cid-tags">
          {cid.restricao_sexo && (
            <span className={`badge ${conflito ? 'danger' : 'muted'}`}>
              {cid.restricao_sexo === 'F' ? 'Só sexo feminino' : 'Só sexo masculino'}
              {conflito && ', diferente do paciente'}
            </span>
          )}
          {cid.classificacao === '+' && (
            <span className="badge muted">Etiologia (†){cid.referencia && `, par ${cid.referencia}`}</span>
          )}
          {cid.classificacao === '*' && <span className="badge muted">Manifestação (*)</span>}
          {cid.causa_obito === false && <span className="badge muted">Não aceito como causa de óbito</span>}
        </div>
      )}
    </>
  )
}

export function BlocoCid({ d, podeEditar }: { d: InternacaoDados; podeEditar: boolean }) {
  const { atribuir, remover } = useCidPaciente(d.id)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [escolhido, setEscolhido] = useState<Cid | null>(null)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const busca = useCidBusca(escolhido ? '' : texto)
  const { data: atual } = useCidDetalhe(d.cid_codigo)

  // Código completo digitado: escolhe sozinho assim que o catálogo confirma.
  // É o "digitou a numeração, já puxa o nome" (sem clicar na sugestão). Uma
  // categoria com subdivisões ("J18") NÃO é escolhida sozinha: quase sempre o
  // técnico está a caminho de "J18.9", e a lista das subcategorias fica aberta.
  useEffect(() => {
    const cod = normalizarCid(texto)
    const exato = cod ? busca.itens.find((i) => i.codigo === cod) : undefined
    const temSubdivisao = !!cod && busca.itens.some((i) => i.codigo.startsWith(`${cod}.`))
    if (exato && !temSubdivisao && !escolhido) {
      setEscolhido(exato)
      setAberto(false)
    }
  }, [texto, busca.itens, escolhido])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function limpar() {
    setTexto('')
    setEscolhido(null)
    setErro(null)
    setAberto(false)
  }

  function escolher(c: Cid) {
    setEscolhido(c)
    setTexto(c.codigo)
    setAberto(false)
  }

  function onKey(e: React.KeyboardEvent) {
    const itens = busca.itens
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setAberto(true); setAtivo((i) => Math.min(i + 1, itens.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto && itens[ativo]) {
      e.preventDefault(); escolher(itens[ativo])
    } else if (e.key === 'Escape' && aberto) {
      // Sem isto o Escape atravessaria para o drawer e fecharia o paciente.
      e.stopPropagation(); setAberto(false)
    }
  }

  async function salvar() {
    if (!escolhido) return
    setErro(null)
    try {
      await atribuir.mutateAsync(escolhido.codigo)
      limpar()
      setEditando(false)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atribuir o CID')
    }
  }

  async function tirar() {
    setErro(null)
    try {
      await remover.mutateAsync()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível remover o CID')
    }
  }

  // Quem não edita só vê o bloco quando há CID: "sem CID" para leitor é ruído.
  if (!podeEditar && !d.cid_codigo) return null

  const mostrarCampo = podeEditar && (editando || !d.cid_codigo)
  const salvando = atribuir.isPending || remover.isPending

  return (
    <div style={{ marginBottom: 22 }}>
      <style>{estilos}</style>
      <div className="section-label" style={{ marginTop: 0 }}>CID</div>

      {d.cid_codigo && !editando && (
        <div className="dk" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-md)', color: 'var(--ink-2)' }}>
              <span className="cid-cod">{d.cid_codigo}</span>
              {d.cid_descricao}
            </div>
            {atual && <Detalhe cid={atual} sexoPaciente={d.sexo} />}
            {d.cid_atribuido_por && (
              <div className="dk-meta" style={{ marginTop: 8 }}>
                Atribuído por {d.cid_atribuido_por}
                {d.cid_atribuido_em && ` em ${dataHora(d.cid_atribuido_em)}`}
              </div>
            )}
          </div>
          {podeEditar && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button type="button" className="btn btn-outline btn-sm" disabled={salvando}
                onClick={() => { limpar(); setEditando(true) }}>
                Trocar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={salvando}
                onClick={() => void tirar()}>
                {remover.isPending ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarCampo && (
        <>
          <div className="cid-wrap" ref={wrapRef}>
            <input
              type="text"
              className="bm-input"
              placeholder="Código (ex.: J18.9) ou nome da doença"
              autoComplete="off"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setEscolhido(null)
                setAberto(true)
                setAtivo(0)
              }}
              onFocus={() => { if (!escolhido && texto.trim().length >= 2) setAberto(true) }}
              onKeyDown={onKey}
            />
            {aberto && !escolhido && texto.trim().length >= 2 && (
              <div className="cid-menu">
                {busca.carregando && busca.itens.length === 0 && <div className="cid-vazio">Buscando…</div>}
                {!busca.carregando && busca.erro && <div className="cid-vazio">Não foi possível buscar agora</div>}
                {!busca.carregando && !busca.erro && busca.itens.length === 0 && (
                  <div className="cid-vazio">Nenhum CID encontrado</div>
                )}
                {busca.itens.map((c, i) => (
                  <div
                    key={c.codigo}
                    className={`cid-opt${i === ativo ? ' active' : ''}`}
                    onMouseEnter={() => setAtivo(i)}
                    onMouseDown={(e) => { e.preventDefault(); escolher(c) }}
                  >
                    <span className="cid-opt-cod">{c.codigo}</span>
                    <span>{c.descricao}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {escolhido && (
            <div className="dk" style={{ marginTop: 10 }}>
              <div style={{ fontSize: 'var(--t-md)', color: 'var(--ink-2)' }}>
                <span className="cid-cod">{escolhido.codigo}</span>
                {escolhido.descricao}
              </div>
              <Detalhe cid={escolhido} sexoPaciente={d.sexo} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="button" className="btn btn-outline" disabled={!escolhido || salvando}
              onClick={() => void salvar()}>
              {atribuir.isPending ? 'Salvando…' : d.cid_codigo ? 'Trocar CID' : 'Atribuir CID'}
            </button>
            {editando && (
              <button type="button" className="btn btn-ghost" disabled={salvando}
                onClick={() => { limpar(); setEditando(false) }}>
                Cancelar
              </button>
            )}
          </div>
        </>
      )}

      {erro && (
        <div className="badge danger" style={{ marginTop: 8, padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>
          {erro}
        </div>
      )}
    </div>
  )
}
