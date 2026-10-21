// Seção da modal "Registrar relatório" que reduz e expande (pedido de
// 08/10/2026: "cada aba deve ter um menu drop"). As seções formam uma lista com
// divisórias; fechada, cada uma mostra o título e, embaixo, o resumo do que já
// está preenchido. O conteúdo continua montado
// (só escondido): fechar não perde nada, e a sugestão de acomodação da ficha
// funciona mesmo com a seção fechada. Estilos `rr-grupo*` em ModalRelatorio.
//
// No fim de cada seção, "OK" (pedido de 20/10/2026: "ao final do registro de
// cada item, colocar um ok, para ir para o próximo passo") fecha a seção e abre
// a seguinte; quem confere os campos é a modal (`onOk`). A seção finalizada
// no OK ganha o "Concluída" verde ao lado do título.
import type { ReactNode } from 'react'

export function GrupoRecolhivel({ id, titulo, nota, concluida, resumo, aberto, onAlternar, onOk, proxima, children }: {
  /** Âncora da seção: a modal rola até a próxima depois do "OK". */
  id?: string
  titulo: string
  /** Texto curto ao lado do título (ex.: "Como no último relatório"). */
  nota?: string
  /** Finalizada no "OK" e ainda em ordem. */
  concluida?: boolean
  /** O que está preenchido, para ler com a seção fechada. */
  resumo?: string
  aberto?: boolean
  onAlternar?: () => void
  /** O "OK" do fim da seção. Sem ele, o botão não aparece. */
  onOk?: () => void
  /** Título da seção que o "OK" abre (a última não tem). */
  proxima?: string
  children: ReactNode
}) {
  const textos = (
    <span className="rr-grupo-textos">
      <span className="rr-grupo-linha1">
        <span className="rr-grupo-tit">{titulo}</span>
        {concluida && (
          <span className="rr-grupo-concluida">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Concluída
          </span>
        )}
        {nota && <span className="rr-grupo-nota">{nota}</span>}
      </span>
      {!aberto && resumo && <span className="rr-grupo-resumo" title={resumo}>{resumo}</span>}
    </span>
  )
  return (
    <section id={id} className={`rr-grupo${aberto ? ' aberto' : ''}`}>
      <button type="button" className="rr-grupo-cab" aria-expanded={aberto} onClick={onAlternar}>
        <svg className="rr-grupo-seta" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        {textos}
      </button>
      <div className="rr-grupo-corpo" hidden={!aberto}>
        {children}
        {onOk && (
          <div className="rr-grupo-ok">
            {proxima && <span className="rr-grupo-prox">Próximo: {proxima}</span>}
            {/* Contorno: o primário da modal é o registrar do rodapé. */}
            <button type="button" className="btn btn-outline btn-sm rr-grupo-okbtn" onClick={onOk}
                    aria-label={proxima ? `OK, seguir para ${proxima}` : `OK, fechar ${titulo}`}>
              OK
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
