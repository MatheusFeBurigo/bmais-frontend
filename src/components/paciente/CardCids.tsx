// Card "CID" da ficha: os CIDs vinculados ao paciente e, para o técnico, o campo
// que adiciona e a lixeira que remove cada um.
//
// O campo é um dropdown: clicar abre a lista com TODOS os CIDs do catálogo, em
// ordem de código, e a rolagem traz os seguintes (são 14 mil, vêm em páginas).
// Digitar filtra: código ("J189", "J18.9"), palavras ("pneumonia") ou uma letra
// ("J"). ESCOLHER JÁ ADICIONA, sem botão de confirmar: o que entrou errado sai
// pela lixeira. A gravação confere o código de novo no backend.
//
// Cada CID é um cartão no formato dos relatórios da ficha (borda fina e faixa
// lateral). Adicionar e remover NÃO geram evento na timeline (decisão do
// usuário, 29/09/2026): quem fez o quê fica na trilha de Movimentações.
//
// Vive SÓ na ficha ("Detalhes"). Já esteve no drawer do Painel Operacional e
// saiu de lá: o painel é a fila de trabalho, e o CID é dado clínico do paciente.
import { useEffect, useMemo, useRef, useState } from 'react'
import { LoadingState, Spinner } from '../ui'
import { dataHora } from '../../lib/datas'
import { normalizarCid, sexoConflita } from '../../lib/cid'
import { useCidBusca, useCidsPaciente } from '../../hooks/useCid'
import type { Cid, CidPaciente } from '../../types/api'

const estilos = `
.cid-rotulo{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.08em;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.cid-wrap{position:relative}
/* A seta é a do select (bm-select); o cursor segue de texto, porque se digita. */
.cid-campo{cursor:text}
/* overscroll-behavior: chegar ao fim da lista não rola a página por baixo
   enquanto a página seguinte carrega. */
.cid-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md,8px);box-shadow:0 8px 24px rgba(6,46,92,.12);max-height:300px;overflow-y:auto;overscroll-behavior:contain;padding:4px}
.cid-menu.espera .cid-opt{opacity:.55}
.cid-opt{display:flex;gap:10px;align-items:baseline;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.cid-opt.active{background:var(--primary-soft);color:var(--primary)}
.cid-opt.off{cursor:default;color:var(--muted-2)}
.cid-opt-cod{font-family:var(--font-mono);font-weight:600;min-width:46px;flex-shrink:0}
.cid-opt-ja{margin-left:auto;flex-shrink:0;font-size:var(--t-xs);color:var(--muted)}
.cid-vazio{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
.cid-lista{display:flex;flex-direction:column;gap:12px}
/* Mesmo cartão dos relatórios da ficha. A faixa é o azul-marinho do código. */
.cid-item{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--border);border-left:3px solid var(--primary);border-radius:10px;padding:12px 14px;background:var(--surface)}
.cid-titulo{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.cid-cod{flex-shrink:0;font-family:var(--font-mono);font-size:var(--t-sm);font-weight:700;color:var(--primary);background:var(--primary-soft);border-radius:5px;padding:2px 8px}
.cid-nome{font-size:var(--t-base);font-weight:600;color:var(--ink)}
.cid-hier{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin-top:8px;font-size:var(--t-xs);color:var(--muted)}
.cid-hier b{font-weight:600;color:var(--ink-2)}
.cid-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cid-tags .badge{text-transform:none;letter-spacing:0}
.cid-meta{font-size:var(--t-xs);color:var(--muted-2);margin-top:8px}
/* Lixeira: a mesma da lista de pacientes do envio. Cinza em repouso, vermelho
   só sob o ponteiro ou o foco. */
.cid-lixeira{flex-shrink:0;display:inline-grid;place-items:center;width:28px;height:28px;padding:0;border:1px solid transparent;background:none;border-radius:7px;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.cid-lixeira:hover:not(:disabled){background:var(--danger-bg);border-color:var(--danger-bg-2);color:var(--danger-2)}
.cid-lixeira:focus-visible{outline:none;color:var(--danger-2);background:var(--danger-bg);box-shadow:0 0 0 3px rgba(200,36,60,.18)}
.cid-lixeira:disabled{cursor:default;color:var(--muted-3)}
`

const IcoLixeira = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" /><path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
)

// A hierarquia pode faltar: o código gravado nem sempre está no catálogo.
function Detalhe({ cid, sexoPaciente }: { cid: CidPaciente; sexoPaciente?: string | null }) {
  const conflito = sexoConflita(cid.restricao_sexo, sexoPaciente)
  const temHierarquia = cid.tipo === 'subcategoria' || !!cid.grupo || !!cid.capitulo_romano
  return (
    <>
      {temHierarquia && (
        <div className="cid-hier">
          {cid.tipo === 'subcategoria' && (
            <><span>Categoria</span><span><b>{cid.categoria}</b> {cid.categoria_descricao}</span></>
          )}
          {cid.grupo && <><span>Grupo</span><span><b>{cid.grupo}</b> {cid.grupo_descricao}</span></>}
          {cid.capitulo_romano && (
            <><span>Capítulo</span><span><b>{cid.capitulo_romano}</b> {cid.capitulo_descricao}</span></>
          )}
        </div>
      )}
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

export function CardCids({ internacaoId, sexoPaciente, podeEditar, onAlterado }: {
  internacaoId: number
  sexoPaciente?: string | null
  podeEditar: boolean
  onAlterado: (msg: string) => void
}) {
  const { lista, adicionar, remover } = useCidsPaciente(internacaoId)
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // A rolagem até o item ativo só vale para as setas: com o mouse, o item sob o
  // ponteiro já está à vista, e rolar a lista debaixo dele trocaria o item.
  const porTeclado = useRef(false)
  // Enter dado antes de a lista chegar (quem digita o código e confirma em
  // seguida). Fica guardado e vale quando ela chegar: ver o efeito abaixo.
  const enterGuardado = useRef(false)

  const busca = useCidBusca(texto, aberto)
  const cids = lista.data?.cids
  const jaTem = useMemo(() => new Set((cids ?? []).map((c) => c.codigo)), [cids])
  const gravando = adicionar.isPending

  async function escolher(c: Cid) {
    if (jaTem.has(c.codigo) || gravando) return
    setErro(null)
    setAberto(false)
    setTexto('')
    try {
      await adicionar.mutateAsync(c.codigo)
      onAlterado(`✓ CID ${c.codigo} adicionado`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível adicionar o CID')
    }
  }
  // O efeito do Enter guardado chama a versão mais recente, sem depender dela.
  const escolherRef = useRef(escolher)
  useEffect(() => { escolherRef.current = escolher })

  // O Enter guardado só vale para CÓDIGO digitado, e só se ele é o primeiro da
  // lista que chegou. Com palavras ("pneumonia"), o primeiro resultado é um
  // entre dezenas: adicioná-lo sem a lista na tela seria escolher às cegas.
  useEffect(() => {
    if (busca.carregando || !enterGuardado.current) return
    enterGuardado.current = false
    const codigo = normalizarCid(texto)
    const primeiro = busca.itens[0]
    if (aberto && codigo && primeiro?.codigo === codigo) void escolherRef.current(primeiro)
  }, [busca.carregando, busca.itens, texto, aberto])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // O card fica no pé da coluna: a lista abriria fora da tela.
  useEffect(() => {
    if (aberto) menuRef.current?.scrollIntoView({ block: 'nearest' })
  }, [aberto])

  useEffect(() => {
    if (!aberto || !porTeclado.current) return
    porTeclado.current = false
    menuRef.current?.querySelector('.cid-opt.active')?.scrollIntoView({ block: 'nearest' })
  }, [ativo, aberto])

  const { carregarMais } = busca
  // Perto do fim da lista, pede a página seguinte. Serve o mouse e as setas: a
  // rolagem até o item ativo também passa por aqui.
  function aoRolar(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) carregarMais()
  }

  function abrir() {
    if (!gravando) setAberto(true)
  }

  function onKey(e: React.KeyboardEvent) {
    const itens = busca.itens
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      porTeclado.current = true
      abrir()
      setAtivo((i) => Math.min(i + 1, Math.max(itens.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      porTeclado.current = true
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto) {
      e.preventDefault()
      // Com a busca em curso, a lista na tela ainda é a anterior: o Enter
      // adicionaria um CID que não é o que foi digitado.
      if (busca.carregando) enterGuardado.current = true
      else if (itens[ativo]) void escolher(itens[ativo])
    } else if (e.key === 'Escape' && aberto) {
      setAberto(false)
    }
  }

  async function tirar(c: CidPaciente) {
    setErro(null)
    try {
      await remover.mutateAsync(c.id)
      onAlterado(`✓ CID ${c.codigo} removido`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível remover o CID')
    }
  }

  // Quem não edita só vê o card quando há CID: "sem CID" para leitor é ruído.
  if (!podeEditar && !cids?.length) return null

  return (
    // `overflow: visible` porque a lista do campo passa da borda do card, e o
    // `.card` a cortaria.
    <div className="card" style={{ overflow: 'visible' }}>
      <style>{estilos}</style>
      <div className="card-header">
        <div className="card-title">CID</div>
        <span className="badge muted">{cids?.length ?? 0}</span>
      </div>
      <div className="card-body">
        {podeEditar && (
          <div style={{ marginBottom: 14 }}>
            <label className="cid-rotulo" htmlFor={`cid-campo-${internacaoId}`}>
              Adicionar CID
              {gravando && <Spinner size={11} />}
            </label>
            <div className="cid-wrap" ref={wrapRef}>
              <input
                id={`cid-campo-${internacaoId}`}
                type="text"
                role="combobox"
                aria-expanded={aberto}
                aria-autocomplete="list"
                className="bm-input bm-select cid-campo"
                placeholder="Código (ex.: J18.9) ou nome da doença"
                autoComplete="off"
                // Só leitura enquanto grava: o foco fica no campo, pronto para o
                // próximo CID, e uma segunda escolha não atropela a primeira.
                readOnly={gravando}
                value={texto}
                onChange={(e) => {
                  enterGuardado.current = false
                  setTexto(e.target.value)
                  setErro(null)
                  setAberto(true)
                  setAtivo(0)
                }}
                // O clique além do foco: com o campo já focado e a lista fechada
                // (Esc, ou depois de escolher), só o clique a reabre.
                onFocus={abrir}
                onClick={abrir}
                onKeyDown={onKey}
              />
              {aberto && (
                <div ref={menuRef} role="listbox" aria-busy={busca.carregando}
                  className={`cid-menu${busca.carregando ? ' espera' : ''}`} onScroll={aoRolar}>
                  {busca.carregando && busca.itens.length === 0 && <div className="cid-vazio">Buscando…</div>}
                  {!busca.carregando && busca.erro && <div className="cid-vazio">Não foi possível buscar agora</div>}
                  {!busca.carregando && !busca.erro && busca.itens.length === 0 && (
                    <div className="cid-vazio">Nenhum CID encontrado</div>
                  )}
                  {busca.itens.map((c, i) => {
                    const ja = jaTem.has(c.codigo)
                    return (
                      <div
                        key={c.codigo}
                        role="option"
                        aria-selected={i === ativo}
                        className={`cid-opt${ja ? ' off' : i === ativo ? ' active' : ''}`}
                        aria-disabled={ja}
                        onMouseEnter={() => setAtivo(i)}
                        // `preventDefault` no mousedown: sem ele o campo perde o
                        // foco antes de o clique registrar.
                        onMouseDown={(e) => { e.preventDefault(); void escolher(c) }}
                      >
                        <span className="cid-opt-cod">{c.codigo}</span>
                        <span>{c.descricao}</span>
                        {ja && <span className="cid-opt-ja">Já adicionado</span>}
                      </div>
                    )
                  })}
                  {busca.carregandoMais && <div className="cid-vazio">Carregando mais…</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {erro && (
          <div className="badge danger" style={{ marginBottom: 12, padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>
            {erro}
          </div>
        )}

        {lista.isLoading && <LoadingState label="Carregando CIDs…" size={22} style={{ padding: '24px 8px' }} />}
        {lista.isError && (
          <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar os CIDs.</div>
        )}
        {cids && cids.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 8px', fontWeight: 600, color: 'var(--muted)' }}>
            Nenhum CID
          </div>
        )}
        {cids && cids.length > 0 && (
          <div className="cid-lista">
            {cids.map((c) => (
              <div key={c.id} className="cid-item">
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div className="cid-titulo">
                    <span className="cid-cod">{c.codigo}</span>
                    <span className="cid-nome">{c.descricao}</span>
                  </div>
                  <Detalhe cid={c} sexoPaciente={sexoPaciente} />
                  {c.atribuido_por && (
                    <div className="cid-meta">
                      Adicionado por {c.atribuido_por}
                      {c.atribuido_em && ` em ${dataHora(c.atribuido_em)}`}
                    </div>
                  )}
                </div>
                {podeEditar && (
                  <button type="button" className="cid-lixeira" title="Remover"
                    aria-label={`Remover CID ${c.codigo}`}
                    disabled={remover.isPending} onClick={() => void tirar(c)}>
                    {remover.isPending && remover.variables === c.id ? <Spinner size={13} /> : IcoLixeira}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
