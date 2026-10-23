// Quem responde pelo card (23/10/2026): as pessoas da equipe que o têm no
// próprio quadro de Tarefas. A regra (área da Distribuição de tarefas, por
// coluna) mora no backend, em application/responsaveis.py; aqui é só exibição.
//
// No card, só as bolinhas com as iniciais, sobrepostas, na cor do grupo
// (técnico azul, operacional verde); passando de MAX, o resto vira "+N".
// Clicar abre o balão com nome, cargo e e-mail de cada pessoa. O balão mora no
// <body> (portal, position:fixed): dentro do card, a rolagem da coluna o
// cortaria. Lista vazia é informação ("Sem responsável": hospital que ninguém
// cobre); ausente (o backend não montou a equipe), o card não mostra nada.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { ROLE_LABEL } from '../../lib/usuarioRoles'
import type { ResponsavelCard } from '../../types/api'
import { iniciais } from '../volumetria/volumetria.model'

const MAX = 4
const GRUPO_TECNICO = new Set(['tecnico', 'coordenador_tecnico'])

const cargo = (p: ResponsavelCard) => ROLE_LABEL[p.papel] ?? p.papel

function Bolinha({ p }: { p: ResponsavelCard }) {
  return (
    <span className={`kb-resp-av ${GRUPO_TECNICO.has(p.papel) ? 'tec' : 'op'}`} aria-hidden="true">
      {iniciais(p.nome)}
    </span>
  )
}

// O card inteiro abre a ficha no clique (e o de censo, no Enter): as bolinhas e
// o balão (que, mesmo no portal, propaga pela árvore do React) não podem abrir.
const parar = (e: SyntheticEvent) => e.stopPropagation()

export function ResponsaveisCard({ pessoas }: { pessoas?: ResponsavelCard[] }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Junto das bolinhas, para baixo ou para cima conforme o espaço; acompanha a
  // rolagem do quadro e das colunas (`capture` pega o scroll de qualquer uma).
  useLayoutEffect(() => {
    if (!aberto) return
    function posicionar() {
      const r = btnRef.current?.getBoundingClientRect()
      if (!r) return
      const alt = popRef.current?.offsetHeight ?? 200
      const larg = popRef.current?.offsetWidth ?? 260
      const cima = window.innerHeight - r.bottom < alt + 12 && r.top > window.innerHeight - r.bottom
      const left = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8))
      setPos({ left, top: cima ? Math.max(8, r.top - alt - 6) : r.bottom + 6 })
    }
    posicionar()
    window.addEventListener('scroll', posicionar, true)
    window.addEventListener('resize', posicionar)
    return () => {
      window.removeEventListener('scroll', posicionar, true)
      window.removeEventListener('resize', posicionar)
      setPos({ visibility: 'hidden' })
    }
  }, [aberto])

  // Fecha ao clicar fora e no Escape (sem deixar o Escape fechar o que estiver
  // por baixo).
  useEffect(() => {
    if (!aberto) return
    function onDoc(e: MouseEvent) {
      const alvo = e.target as Node
      if (btnRef.current?.contains(alvo) || popRef.current?.contains(alvo)) return
      setAberto(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setAberto(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [aberto])

  if (!pessoas) return null
  if (!pessoas.length) {
    return (
      <span className="kb-resp-vazio" title="Nenhuma pessoa da equipe cobre este card na Distribuição de tarefas">
        Sem responsável
      </span>
    )
  }
  const resto = pessoas.length - MAX
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="kb-resp-btn"
        onClick={(e) => { parar(e); setAberto((v) => !v) }}
        onKeyDown={parar}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={`Responsáveis: ${pessoas.map((p) => p.nome).join(', ')}`}
        title={pessoas.map((p) => p.nome).join(', ')}
      >
        {pessoas.slice(0, MAX).map((p) => <Bolinha key={p.user_id} p={p} />)}
        {resto > 0 && <span className="kb-resp-av mais" aria-hidden="true">+{resto}</span>}
      </button>

      {aberto && createPortal(
        <div ref={popRef} className="kb-resp-pop" style={pos} role="dialog" aria-label="Responsáveis pelo card"
             onClick={parar} onKeyDown={parar}>
          <div className="kb-resp-pop-tit">
            {pessoas.length === 1 ? 'Responsável' : `Responsáveis (${pessoas.length})`}
          </div>
          <ul className="kb-resp-pop-lista">
            {pessoas.map((p) => (
              <li key={p.user_id} className="kb-resp-pop-item">
                <Bolinha p={p} />
                <span className="kb-resp-pop-txt">
                  <span className="kb-resp-pop-nome">{p.nome}</span>
                  <span className="kb-resp-pop-cargo">{cargo(p)}</span>
                  {p.email && <a className="kb-resp-pop-email" href={`mailto:${p.email}`}>{p.email}</a>}
                </span>
              </li>
            ))}
          </ul>
        </div>,
        document.body)}
    </>
  )
}
