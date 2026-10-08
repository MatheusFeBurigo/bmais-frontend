// Seção da modal "Registrar relatório" que reduz e expande (pedido de
// 08/10/2026: "cada aba deve ter um menu drop"). Fechada, mostra o título e um
// resumo de uma linha do que já está preenchido. O conteúdo continua montado
// (só escondido): fechar não perde nada, e a sugestão de acomodação da ficha
// funciona mesmo com a seção fechada. Estilos `rr-grupo*` em ModalRelatorio.
import type { ReactNode } from 'react'

export function GrupoRecolhivel({ titulo, nota, resumo, aberto, onAlternar, children }: {
  titulo: string
  /** Texto curto ao lado do título (ex.: "Como no último relatório"). */
  nota?: string
  /** O que está preenchido, para ler com a seção fechada. */
  resumo?: string
  aberto: boolean
  onAlternar: () => void
  children: ReactNode
}) {
  return (
    <section className={`rr-sec rr-grupo${aberto ? ' aberto' : ''}`}>
      <button type="button" className="rr-grupo-cab" aria-expanded={aberto} onClick={onAlternar}>
        <svg className="rr-grupo-seta" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="rr-grupo-tit">{titulo}</span>
        {nota && <span className="rr-titulo-nota">{nota}</span>}
        <span className="rr-grupo-traco" aria-hidden="true" />
        {!aberto && resumo && <span className="rr-grupo-resumo" title={resumo}>{resumo}</span>}
      </button>
      <div className="rr-grupo-corpo" hidden={!aberto}>{children}</div>
    </section>
  )
}
