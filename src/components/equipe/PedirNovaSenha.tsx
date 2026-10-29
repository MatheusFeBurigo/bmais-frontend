// "Pedir troca", ao lado do "Senha" nas listas de Operações (28/10/2026).
//
// Diferente do Senha, não define senha nenhuma: a atual segue valendo, e no
// próximo acesso a pessoa vê "Crie sua senha" (SenhaProvisoriaModal), a mesma
// tela de quem recebeu uma senha provisória. Enquanto ela não troca, a linha
// mostra "Troca pedida".
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmarModal } from '../ConfirmarModal'
import { pedirNovaSenha } from '../../services/usuarios.service'
import { invalidarPorEvento } from '../../lib/invalidation'

const IconEnviar = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>
)
const IconOk = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
)

export function PedirNovaSenhaBotao({ pedida, semConta, onClick }: {
  /** A conta já aguarda a senha nova: não há o que pedir de novo. */
  pedida?: boolean
  /** Auditor sem conta de acesso: não há a quem pedir. */
  semConta?: boolean
  onClick: () => void
}) {
  const title = semConta
    ? 'Sem conta de acesso'
    : pedida
      ? 'No próximo acesso a pessoa vê Crie sua senha'
      : 'Pedir que a pessoa crie uma senha nova no próximo acesso'
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      // Na lista de auditores a linha é clicável e abriria a ficha junto.
      onClick={(e: MouseEvent) => { e.stopPropagation(); onClick() }}
      disabled={semConta || pedida}
      title={title}
      // Mesma largura nos dois estados: senão o "Senha" ao lado sai do alinhamento
      // entre as linhas com e sem pedido.
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', minWidth: 116 }}
    >
      {pedida ? <>{IconOk}Troca pedida</> : <>{IconEnviar}Pedir troca</>}
    </button>
  )
}

export function PedirNovaSenhaModal({ userId, nome, onClose, onDone }: {
  userId: string
  /** Quem recebe o pedido (nome ou, sem nome, o e-mail). */
  nome: string
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const qc = useQueryClient()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar() {
    setOcupado(true)
    setErro(null)
    try {
      await pedirNovaSenha(userId)
      // As duas listas mostram o "Troca pedida", e a trilha ganha o registro.
      invalidarPorEvento(qc, 'usuariosAlterados')
      invalidarPorEvento(qc, 'equipeAlterada')
      onDone(`✓ Troca de senha pedida a ${nome}`)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <ConfirmarModal
      titulo="Pedir nova senha"
      confirmar="Pedir troca"
      ocupado={ocupado}
      onConfirmar={confirmar}
      onCancelar={onClose}
    >
      <p style={{ margin: 0 }}>No próximo acesso, <strong>{nome}</strong> vai ver a tela{' '}
        <strong>Crie sua senha</strong> e escolher uma senha própria.</p>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
        A senha atual continua valendo até a troca. Quem está com o sistema aberto vê a tela ao
        recarregar a página. <strong>Agora não</strong> adia o pedido, que volta a cada acesso.
      </p>
      {erro && <p className="uac-erro" role="alert">{erro}</p>}
    </ConfirmarModal>
  )
}
