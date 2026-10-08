// Bloco que só abre quando marcado: substitui os "Tem X? Sim/Não" do portal
// antigo (não marcado é "não"). Usado por todos os blocos dos grupos "No
// período", "Continuidade" e "Negociação com o hospital" da modal. Estilos
// `rr-bloco*` em ModalRelatorio.
import type { ReactNode } from 'react'

export function BlocoOpcional({ titulo, marcado, onMarcar, extra, tom, desabilitado, children }: {
  titulo: string
  marcado: boolean
  onMarcar: (ligar: boolean) => void
  /** Contagem ou resumo curto à direita do título (ex.: "2"). */
  extra?: ReactNode
  /** Folha rosa pinta o bloco de rosa, como na timeline. */
  tom?: 'rosa'
  desabilitado?: boolean
  children: ReactNode
}) {
  return (
    <div className={`rr-bloco${marcado ? ' on' : ''}${tom === 'rosa' ? ' rosa' : ''}`}>
      <label className="rr-bloco-tg">
        <input type="checkbox" checked={marcado} disabled={desabilitado}
               onChange={(e) => onMarcar(e.target.checked)} />
        <span>{titulo}</span>
        {extra != null && extra !== '' && <span className="rr-bloco-extra">{extra}</span>}
      </label>
      {marcado && <div className="rr-bloco-corpo">{children}</div>}
    </div>
  )
}
