// Lista com linha de entrada: os campos de um item + "Adicionar", e embaixo os
// itens já adicionados, NAS MESMAS COLUNAS da entrada (cada valor fica sob o
// seu campo), com editar e remover na coluna do botão. Usada pelas acomodações
// utilizadas e pelos blocos em lista. Estilos `rr-lista*` em ModalRelatorio.
//
// Entradas longas quebram em duas linhas: o campo que ocupa o resto da linha
// usa `rr-resto` (da 2ª coluna ao fim), `rr-linha` (a linha toda) ou `rr-dupla`
// (as duas primeiras colunas), e a célula da lista usa a mesma `largura`.
import type { CSSProperties, ReactNode } from 'react'

/** Uma célula da lista: o conteúdo, ou o conteúdo e a largura dele. */
type Largura = 'resto' | 'linha' | 'dupla'
export type CelulaLista = ReactNode | { conteudo: ReactNode; largura: Largura }

function ehLarga(c: CelulaLista): c is { conteudo: ReactNode; largura: Largura } {
  return typeof c === 'object' && c !== null && 'largura' in (c as object)
}

export function ListaItens({ campos, colunas, onAdicionar, podeAdicionar, linhas, onRemover, onEditar, desabilitado }: {
  /** Os campos da linha de entrada, na ordem das colunas. */
  campos: ReactNode
  /** `grid-template-columns` da entrada e da lista, contando a última coluna
   *  (a do botão "Adicionar" e das ações de cada item). */
  colunas: string
  onAdicionar: () => void
  podeAdicionar: boolean
  /** Um item por linha, com uma célula por campo, na ordem dos campos. */
  linhas: CelulaLista[][]
  onRemover: (i: number) => void
  /** Devolve o item à linha de entrada para corrigir. */
  onEditar?: (i: number) => void
  desabilitado?: boolean
}) {
  const grade = { gridTemplateColumns: colunas } as CSSProperties
  return (
    <div className="rr-lista-wrap">
      <div className="rr-lista-entrada" style={grade}>
        {campos}
        <button type="button" className="btn btn-outline btn-sm rr-lista-add"
                disabled={!podeAdicionar || desabilitado} onClick={onAdicionar}>
          Adicionar
        </button>
      </div>
      {linhas.length > 0 && (
        <div className="rr-lista">
          {linhas.map((celulas, i) => (
            <div className="rr-lista-linha" style={grade} key={i}>
              {celulas.map((c, j) => (
                ehLarga(c)
                  ? <span key={j} className={`rr-cel rr-${c.largura}`}>{c.conteudo}</span>
                  : <span key={j} className="rr-cel">{c}</span>
              ))}
              <span className="rr-acoes">
                {onEditar && (
                  <button type="button" className="rr-x" aria-label="Editar" title="Editar" disabled={desabilitado}
                          onClick={() => onEditar(i)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  </button>
                )}
                <button type="button" className="rr-x" aria-label="Remover" title="Remover" disabled={desabilitado}
                        onClick={() => onRemover(i)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
