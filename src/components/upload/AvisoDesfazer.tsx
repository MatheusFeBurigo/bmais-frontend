// Aviso de ação concluída, com a chance de voltar atrás.
//
// Diferente do `Toast` comum (rodapé, centralizado, `pointer-events:none`): este
// precisa ser CLICÁVEL, e some por conta própria depois de um tempo. O padrão é
// o mesmo de "mensagem arquivada — desfazer": a ação acontece de imediato, sem
// travar o fluxo, e a saída fica ali por alguns segundos.
//
// Fica no topo À DIREITA por dois motivos: a lista que ele comenta ocupa o
// centro da tela (um aviso no rodapé pediria para o olho sair de onde estava),
// e a área é a mesma onde o resto da tela põe ações do arquivo.
//
// A contagem regressiva é visível — uma barra que esvazia. Sem ela o usuário não
// sabe quanto tempo tem para decidir, e "desfazer" com prazo secreto é uma
// promessa que o sistema pode não cumprir.

import { useEffect, useRef, useState } from 'react'

export const avisoDesfazerStyles = `
.up-aviso-undo{position:fixed;top:18px;right:18px;z-index:400;display:flex;align-items:center;gap:12px;max-width:min(420px,calc(100vw - 36px));padding:11px 13px;background:var(--ink);color:#fff;border-radius:var(--r-md);box-shadow:var(--shadow-lg);animation:up-undo-entra .2s cubic-bezier(.2,.7,.2,1);overflow:hidden}
@keyframes up-undo-entra{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
/* Saindo: o mesmo caminho de volta, para o aviso não "piscar" fora da tela. */
.up-aviso-undo.saindo{animation:up-undo-sai .18s ease-in forwards}
@keyframes up-undo-sai{to{opacity:0;transform:translateY(-10px)}}
.up-aviso-undo-ico{flex-shrink:0;display:grid;place-items:center;color:rgba(255,255,255,.72)}
.up-aviso-undo-txt{flex:1;min-width:0;font-size:var(--t-sm);line-height:1.4}
.up-aviso-undo-txt b{font-weight:600}
.up-aviso-undo-sub{display:block;font-size:var(--t-xs);color:rgba(255,255,255,.62);margin-top:1px}
/* "Desfazer" é a razão de o aviso existir: lê-se como botão, não como rótulo. */
.up-aviso-undo-btn{flex-shrink:0;padding:5px 12px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);border-radius:99px;font-family:inherit;font-size:var(--t-xs);font-weight:700;color:#fff;cursor:pointer;transition:background .12s,border-color .12s}
.up-aviso-undo-btn:hover:not(:disabled){background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.5)}
.up-aviso-undo-btn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(255,255,255,.35)}
.up-aviso-undo-btn:disabled{opacity:.6;cursor:default}
.up-aviso-undo-x{flex-shrink:0;display:grid;place-items:center;width:22px;height:22px;border:0;background:none;border-radius:50%;color:rgba(255,255,255,.6);cursor:pointer}
.up-aviso-undo-x:hover{background:rgba(255,255,255,.14);color:#fff}
/* Barra do tempo restante: o prazo do desfazer fica VISÍVEL. */
.up-aviso-undo-barra{position:absolute;left:0;bottom:0;height:2px;background:rgba(255,255,255,.45);animation:up-undo-barra linear forwards}
@keyframes up-undo-barra{from{width:100%}to{width:0}}
@media (prefers-reduced-motion:reduce){
  .up-aviso-undo,.up-aviso-undo.saindo,.up-aviso-undo-barra{animation:none}
}
`

const IcoLixo = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" /><path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
)

const IcoFechar = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

/** Quanto tempo o desfazer fica disponível. 8s: tempo de ler o aviso, perceber
 *  o erro e reagir — 3s do toast comum é curto para uma ação destrutiva. */
const SEGUNDOS = 8

export function AvisoDesfazer({ texto, detalhe, onDesfazer, onFechar, desfazendo }: {
  texto: React.ReactNode
  detalhe?: React.ReactNode
  /** Ausente = aviso sem volta (a ação não é reversível). */
  onDesfazer?: () => void
  onFechar: () => void
  desfazendo?: boolean
}) {
  const [saindo, setSaindo] = useState(false)
  // `onFechar` costuma ser uma função nova a cada render do pai; guardá-la numa
  // ref evita que o timer seja reiniciado a cada um — o aviso ficaria eterno.
  const fecharRef = useRef(onFechar)
  fecharRef.current = onFechar

  useEffect(() => {
    // Enquanto desfaz, o aviso não some no meio da operação.
    if (desfazendo) return
    const t = setTimeout(() => {
      setSaindo(true)
      setTimeout(() => fecharRef.current(), 180)
    }, SEGUNDOS * 1000)
    return () => clearTimeout(t)
  }, [desfazendo])

  return (
    <div className={`up-aviso-undo${saindo ? ' saindo' : ''}`} role="status">
      <span className="up-aviso-undo-ico">{IcoLixo}</span>
      <div className="up-aviso-undo-txt">
        {texto}
        {detalhe && <span className="up-aviso-undo-sub">{detalhe}</span>}
      </div>
      {onDesfazer && (
        <button type="button" className="up-aviso-undo-btn"
                disabled={desfazendo} onClick={onDesfazer}>
          {desfazendo ? 'Desfazendo…' : 'Desfazer'}
        </button>
      )}
      <button type="button" className="up-aviso-undo-x"
              onClick={onFechar} aria-label="Fechar aviso">
        {IcoFechar}
      </button>
      <span className="up-aviso-undo-barra"
            style={{ animationDuration: `${SEGUNDOS}s` }} />
    </div>
  )
}
