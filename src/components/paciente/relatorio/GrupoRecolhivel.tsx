// Seção da modal "Registrar relatório" que reduz e expande (pedido de
// 08/10/2026: "cada aba deve ter um menu drop"). As seções formam uma lista com
// divisórias; fechada, cada uma mostra o título e, embaixo, o resumo do que já
// está preenchido. O conteúdo continua montado
// (só escondido): fechar não perde nada, e a sugestão de acomodação da ficha
// funciona mesmo com a seção fechada. Estilos `rr-grupo*` em ModalRelatorio.
import type { ReactNode } from 'react'

export function GrupoRecolhivel({ titulo, nota, resumo, aberto, onAlternar, children }: {
  titulo: string
  /** Texto curto ao lado do título (ex.: "Como no último relatório"). */
  nota?: string
  /** O que está preenchido, para ler com a seção fechada. */
  resumo?: string
  aberto?: boolean
  onAlternar?: () => void
  children: ReactNode
}) {
  const textos = (
    <span className="rr-grupo-textos">
      <span className="rr-grupo-linha1">
        <span className="rr-grupo-tit">{titulo}</span>
        {nota && <span className="rr-grupo-nota">{nota}</span>}
      </span>
      {!aberto && resumo && <span className="rr-grupo-resumo" title={resumo}>{resumo}</span>}
    </span>
  )
  return (
    <section className={`rr-grupo${aberto ? ' aberto' : ''}`}>
      <button type="button" className="rr-grupo-cab" aria-expanded={aberto} onClick={onAlternar}>
        <svg className="rr-grupo-seta" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        {textos}
      </button>
      <div className="rr-grupo-corpo" hidden={!aberto}>{children}</div>
    </section>
  )
}
