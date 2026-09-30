// Menu "⋮" de ações de uma linha (tabelas de Auditores e Usuários de acesso).
//
// A lista abre em `position: fixed`, calculada a partir do botão: as tabelas
// rolam por dentro (overflow:auto), e um menu absoluto seria cortado nas
// últimas linhas. Perto do fim da tela ele abre para cima.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface ItemMenu {
  rotulo: string
  icone?: ReactNode
  onClick: () => void
  perigo?: boolean
  desabilitado?: boolean
  dica?: string
}

const IconPontos = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
  </svg>
)

export default function MenuAcoes({ itens, rotulo }: { itens: ItemMenu[]; rotulo: string }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!aberto || !botao.current) return
    const r = botao.current.getBoundingClientRect()
    const right = window.innerWidth - r.right
    // ~44px por item + folga: se não cabe abaixo, abre para cima.
    const altura = itens.length * 40 + 12
    setPos(r.bottom + altura > window.innerHeight - 8
      ? { bottom: window.innerHeight - r.top + 4, right }
      : { top: r.bottom + 4, right })
  }, [aberto, itens.length])

  // Fecha no clique fora, no Esc e ao rolar (a posição fixa ficaria solta).
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!botao.current?.contains(alvo) && !lista.current?.contains(alvo)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); botao.current?.focus() } }
    const fechar = () => setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', fechar, true)
    window.addEventListener('resize', fechar)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', fechar, true)
      window.removeEventListener('resize', fechar)
    }
  }, [aberto])

  return (
    <>
      <button
        ref={botao}
        type="button"
        className={`menu-acoes-btn${aberto ? ' aberto' : ''}`}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={rotulo}
        title="Mais ações"
        // A linha da tabela abre a ficha no clique: sem parar, o menu abriria junto.
        onClick={(e) => { e.stopPropagation(); setAberto((v) => !v) }}
      >
        {IconPontos}
      </button>
      {aberto && pos && (
        <div ref={lista} className="menu-acoes-lista" role="menu" style={pos} onClick={(e) => e.stopPropagation()}>
          {itens.map((it) => (
            <button
              key={it.rotulo}
              type="button"
              role="menuitem"
              className={it.perigo ? 'perigo' : undefined}
              disabled={it.desabilitado}
              title={it.dica}
              onClick={() => { setAberto(false); it.onClick() }}
            >
              {it.icone}
              {it.rotulo}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// Ícones das ações mais comuns, para as telas não redesenharem cada um.
const icone = (d: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
export const IconesAcao = {
  desativar: icone(<><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>),
  reativar: icone(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>),
  excluir: icone(<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>),
}
