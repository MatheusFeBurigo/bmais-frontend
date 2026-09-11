// Modal de confirmação do sistema, no lugar do `window.confirm` do navegador.
//
// O confirm nativo aparece como um alerta do Chrome ("localhost:5173 diz"), fora
// da identidade do produto, sem hierarquia entre a ação e o cancelar, e com um
// texto corrido que não permite destacar o que importa (o número de pacientes que
// serão apagados). Esta modal usa o `Modal` do design system e trata a ação
// destrutiva como tal: botão vermelho, cancelar em evidência como saída segura.
import type { ReactNode } from 'react'
import { Modal, Spinner } from './ui'

export function ConfirmarModal({
  titulo, children, confirmar = 'Confirmar', cancelar = 'Cancelar',
  perigo, ocupado, sobreposta, onConfirmar, onCancelar,
}: {
  titulo: string
  /** Corpo: uma ou mais frases. O que for número/consequência vai em <strong>. */
  children: ReactNode
  confirmar?: string
  cancelar?: string
  /** Ação destrutiva (apagar): o botão de confirmar vira vermelho. */
  perigo?: boolean
  /** Em andamento: trava os dois botões e mostra o spinner. */
  ocupado?: boolean
  /** Aberta por cima de outra camada (drawer/assistente): sobe o z-index. */
  sobreposta?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <Modal
      title={titulo}
      sobreposta={sobreposta}
      onClose={ocupado ? () => {} : onCancelar}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm"
                  disabled={ocupado} onClick={onCancelar}>
            {cancelar}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${perigo ? 'btn-perigo' : 'btn-primary'}`}
            disabled={ocupado}
            onClick={onConfirmar}
          >
            {ocupado && <Spinner size={12} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)' }} />}
            {confirmar}
          </button>
        </>
      }
    >
      <style>{`
        .cf-corpo{display:grid;gap:10px;font-size:var(--t-base);color:var(--ink-2);line-height:1.55}
        .cf-corpo strong{color:var(--ink);font-weight:600}
        /* Ação destrutiva: vermelho pleno. O design system não tinha um botão de
           perigo — só a variante de fundo suave usada em avisos. */
        .btn-perigo{background:var(--danger);color:#fff;border-color:var(--danger)}
        .btn-perigo:hover:not(:disabled){background:var(--danger-2);border-color:var(--danger-2)}
      `}</style>
      <div className="cf-corpo">{children}</div>
    </Modal>
  )
}
