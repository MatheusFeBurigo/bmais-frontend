// Réplicas de tela da Ajuda: um pedaço do sistema "como ele é", com números
// clicáveis que abrem a explicação de cada passo num popover sobre a própria
// tela (decisão do usuário, 25/09/2026: nada de texto corrido abaixo da tela).
//
// Três peças:
//   * <ComoFazer>: uma tarefa. Guarda os passos e qual deles está aberto, e é
//     por ela que "Próximo" atravessa de uma réplica para a seguinte (agendar
//     visita começa no quadro e termina na ficha rápida).
//   * <Tela>: a moldura. O miolo é `inert`, um retrato e não a tela de verdade:
//     um botão que não faz nada ensinaria que o botão real não funciona. Os
//     números ficam numa camada POR CIMA do miolo, fora do `inert`, porque é só
//     eles que se clica.
//   * <Alvo>: marca um elemento que a réplica monta. Para marcar algo dentro de
//     um componente real reaproveitado (o formulário do envio, a lista de
//     conferência), a <Tela> recebe `destaques`: seletor CSS → número.
//
// A réplica é desenhada numa largura fixa (a da tela real) e ENCOLHE para caber
// na coluna, com `zoom`. Antes ela tinha largura mínima e rolava para o lado:
// com o zoom de 125% do Windows a coluna fica estreita, e a réplica aparecia
// cortada, com rolagem dentro da página.
import {
  createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef,
  useState, type ReactNode,
} from 'react'

export interface PassoAjuda {
  /** O número do marcador na réplica. */
  n: number
  titulo: string
  corpo: ReactNode
}

interface EstadoComoFazer {
  passos: PassoAjuda[]
  aberto: number | null
  abrir: (n: number | null) => void
}

const ComoFazerCtx = createContext<EstadoComoFazer | null>(null)

/** Uma tarefa: título, uma ou mais <Tela> e os passos que os números abrem. */
export function ComoFazer({ titulo, passos, children }: {
  titulo: string
  passos: PassoAjuda[]
  /** As <Tela> da tarefa, na ordem em que a pessoa passa por elas. */
  children: ReactNode
}) {
  const [aberto, setAberto] = useState<number | null>(null)
  const estado = useMemo(() => ({ passos, aberto, abrir: setAberto }), [passos, aberto])
  return (
    <section className="aj-como">
      <h4 className="aj-como-titulo">
        <span className="aj-como-ico" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        {titulo}
      </h4>
      <ComoFazerCtx.Provider value={estado}>{children}</ComoFazerCtx.Provider>
      {/* Quem usa leitor de tela não enxerga a réplica (ela é um retrato) e
          recebe os passos em lista, na ordem. */}
      <ol className="sr-only">
        {passos.map((p) => <li key={p.n}>{p.titulo}. {p.corpo}</li>)}
      </ol>
    </section>
  )
}

/** Respiro entre a moldura e a réplica, em px. */
const RESPIRO = 16

interface Marca { n: number; x: number; y: number }

/** Moldura de uma réplica. */
export function Tela({ nome, descricao, destaques, largura = 900, children }: {
  /** Nome da tela, como aparece no menu. */
  nome: string
  /** O que a réplica mostra. Vira a legenda e o texto lido pelo leitor de tela. */
  descricao: string
  /** Seletor CSS → número do passo, para marcar dentro de componente real. */
  destaques?: Record<string, number>
  /** Largura em que a réplica é desenhada (a da tela real). Numa coluna mais
   *  estreita ela encolhe inteira, sem rolar para o lado. */
  largura?: number
  children: ReactNode
}) {
  const ctx = useContext(ComoFazerCtx)
  const areaRef = useRef<HTMLDivElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null)
  const idPop = useId()

  // O objeto `destaques` chega recriado a cada render; a chave em texto evita
  // remedir (e re-renderizar) sem que nada tenha mudado.
  const chaveDestaques = JSON.stringify(destaques ?? {})

  const medir = useCallback(() => {
    const area = areaRef.current
    const palco = palcoRef.current
    if (!area || !palco) return
    setEscala(Math.min(1, (area.clientWidth - RESPIRO * 2) / largura))
    for (const [seletor, n] of Object.entries(JSON.parse(chaveDestaques) as Record<string, number>)) {
      const el = palco.querySelector<HTMLElement>(seletor)
      if (el) el.dataset.ajAlvo = String(n)
    }
    const base = area.getBoundingClientRect()
    const vistos = new Set<number>()
    const lista: Marca[] = []
    palco.querySelectorAll<HTMLElement>('[data-aj-alvo]').forEach((el) => {
      const n = Number(el.dataset.ajAlvo)
      if (vistos.has(n)) return
      vistos.add(n)
      const r = el.getBoundingClientRect()
      lista.push({ n, x: Math.round(r.left - base.left), y: Math.round(r.top - base.top) })
    })
    lista.sort((a, b) => a.n - b.n)
    setMarcas((antes) => (JSON.stringify(antes) === JSON.stringify(lista) ? antes : lista))
  }, [largura, chaveDestaques])

  useLayoutEffect(() => { medir() }, [medir, escala])

  // Remede quando a coluna muda de largura, quando o conteúdo muda de altura e
  // quando a fonte termina de carregar (ela muda a largura dos textos).
  useEffect(() => {
    const area = areaRef.current
    const palco = palcoRef.current
    if (!area || !palco) return
    const ro = new ResizeObserver(() => medir())
    ro.observe(area)
    ro.observe(palco)
    document.fonts?.ready.then(() => medir()).catch(() => {})
    return () => ro.disconnect()
  }, [medir])

  // O passo aberto só é desta moldura se o número dele está aqui.
  const aberto = ctx?.aberto != null && marcas.some((m) => m.n === ctx.aberto) ? ctx.aberto : null
  const passos = ctx?.passos ?? []
  const passo = passos.find((p) => p.n === aberto)
  const marcaAberta = marcas.find((m) => m.n === aberto)
  const indice = passos.findIndex((p) => p.n === aberto)

  // Destaque mais forte no elemento do passo aberto, para o olho achar de que
  // ponto da tela o popover está falando.
  useEffect(() => {
    palcoRef.current?.querySelectorAll<HTMLElement>('[data-aj-alvo]').forEach((el) => {
      el.classList.toggle('aj-alvo-ativo', Number(el.dataset.ajAlvo) === aberto)
    })
  }, [aberto, marcas])

  // Posição do popover: abaixo do número, e acima quando não cabe embaixo.
  useLayoutEffect(() => {
    const area = areaRef.current
    const pop = popRef.current
    if (!marcaAberta || !area || !pop) { setPopPos(null); return }
    const larguraArea = area.clientWidth
    const alturaArea = area.clientHeight
    const left = Math.max(8, Math.min(marcaAberta.x - 14, larguraArea - pop.offsetWidth - 8))
    let top = marcaAberta.y + 16
    if (top + pop.offsetHeight > alturaArea - 8 && marcaAberta.y - 16 - pop.offsetHeight >= 8) {
      top = marcaAberta.y - 16 - pop.offsetHeight
    }
    setPopPos({ left, top })
  }, [marcaAberta, passo])

  // Aberto (pelo número ou pelo "Próximo" de outra moldura): traz para a vista
  // e põe o foco no popover, para o teclado seguir o passo.
  useEffect(() => {
    if (aberto == null || !popPos) return
    const pop = popRef.current
    pop?.focus({ preventScroll: true })
    pop?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [aberto, popPos])

  const fechar = useCallback((devolverFoco: boolean) => {
    const n = aberto
    ctx?.abrir(null)
    if (devolverFoco && n != null) {
      areaRef.current?.querySelector<HTMLButtonElement>(`[data-aj-marca="${n}"]`)?.focus()
    }
  }, [aberto, ctx])

  // Esc fecha; clicar fora do popover e dos números também.
  useEffect(() => {
    if (aberto == null) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(true) }
    const clique = (e: PointerEvent) => {
      const alvo = e.target as HTMLElement
      if (popRef.current?.contains(alvo) || alvo.closest('.aj-marca')) return
      fechar(false)
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('pointerdown', clique)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('pointerdown', clique)
    }
  }, [aberto, fechar])

  return (
    <figure className="aj-tela" aria-label={`Exemplo da tela ${nome}. ${descricao}`}>
      <div className="aj-tela-barra" aria-hidden>
        <span className="aj-tela-pontos"><i /><i /><i /></span>
        <span className="aj-tela-nome">{nome}</span>
        <span className="aj-tela-selo">Exemplo com dados fictícios</span>
      </div>
      <div className="aj-tela-area" ref={areaRef} style={{ padding: RESPIRO }}>
        <div className="aj-tela-palco" ref={palcoRef} inert
          style={{ width: largura, zoom: escala }}>
          {children}
        </div>

        {marcas.map((m) => {
          const p = passos.find((x) => x.n === m.n)
          const ativo = aberto === m.n
          return (
            <button
              key={m.n}
              type="button"
              className={`aj-marca${ativo ? ' ativa' : ''}`}
              data-aj-marca={m.n}
              style={{ left: Math.max(2, m.x - 11), top: Math.max(2, m.y - 11) }}
              aria-label={p ? `Passo ${m.n}: ${p.titulo}` : `Passo ${m.n}`}
              aria-expanded={ativo}
              aria-controls={ativo ? idPop : undefined}
              disabled={!p}
              onClick={() => ctx?.abrir(ativo ? null : m.n)}
            >
              {m.n}
            </button>
          )
        })}

        {passo && marcaAberta && (
          <div
            ref={popRef}
            id={idPop}
            className="aj-pop"
            role="dialog"
            aria-label={`Passo ${passo.n}: ${passo.titulo}`}
            tabIndex={-1}
            style={popPos ?? { left: 8, top: marcaAberta.y + 16, visibility: 'hidden' }}
          >
            <div className="aj-pop-topo">
              <span className="aj-pop-conta">Passo {indice + 1} de {passos.length}</span>
              <button type="button" className="aj-pop-x" onClick={() => fechar(true)} aria-label="Fechar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="aj-pop-titulo">{passo.titulo}</div>
            <div className="aj-pop-corpo">{passo.corpo}</div>
            {passos.length > 1 && (
              <div className="aj-pop-nav">
                <button type="button" className="btn btn-ghost btn-sm" disabled={indice <= 0}
                  onClick={() => ctx?.abrir(passos[indice - 1].n)}>
                  Anterior
                </button>
                {indice < passos.length - 1 ? (
                  <button type="button" className="btn btn-primary btn-sm"
                    onClick={() => ctx?.abrir(passos[indice + 1].n)}>
                    Próximo
                  </button>
                ) : (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => fechar(true)}>
                    Concluir
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <figcaption className="aj-tela-legenda">
        {descricao}{' '}
        {marcas.length > 0 && <span className="aj-tela-dica">Clique nos números para ver cada passo.</span>}
      </figcaption>
    </figure>
  )
}

/** Como <Alvo>, mas sem número não marca nada: a mesma réplica serve a
 *  tarefas diferentes, cada uma apontando para os seus pontos. */
export function Marcado({ n, bloco, children }: { n?: number; bloco?: boolean; children: ReactNode }) {
  return n ? <Alvo n={n} bloco={bloco}>{children}</Alvo> : <>{children}</>
}

/** Um modal do sistema, desenhado no fluxo (o real é fixo na janela), sobre um
 *  fundo escurecido. Mesmas classes do `Modal` de components/ui. */
export function ModalReplica({ titulo, largura = 440, rodape, children }: {
  titulo: string
  largura?: number
  rodape?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="aj-modal-palco">
      <div className="card modal-card" style={{ maxWidth: largura }}>
        <div className="card-header modal-head">
          <div className="card-title">{titulo}</div>
          <span className="btn btn-ghost btn-sm">✕</span>
        </div>
        <div className="card-body modal-body">{children}</div>
        {rodape && <div className="modal-foot">{rodape}</div>}
      </div>
    </div>
  )
}

/** Marca um elemento da réplica com o número do passo. */
export function Alvo({ n, bloco, children }: { n: number; bloco?: boolean; children: ReactNode }) {
  const Tag = bloco ? 'div' : 'span'
  return <Tag className={`aj-alvo${bloco ? ' bloco' : ''}`} data-aj-alvo={n}>{children}</Tag>
}
