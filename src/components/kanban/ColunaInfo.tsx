// Ícone "i" ao lado do título da coluna que explica o que ela reúne.
//
// A descrição ficava fixa embaixo do título e ocupava duas linhas em toda
// coluna; quem já conhece o quadro não precisa dela, e quem não conhece passa o
// mouse (ou toca/foca no ícone) para ler.
import { useState } from 'react'

export function ColunaInfo({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <span
      className="kb-info"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        className="kb-info-btn"
        aria-label="O que é esta coluna"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
      </button>
      {aberto && <span className="kb-info-pop" role="tooltip">{texto}</span>}
    </span>
  )
}
