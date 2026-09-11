// Modal de confirmação para apagar uma conta de acesso. Ação irreversível: exige
// um clique de confirmação explícito (não usa window.confirm, seguindo o padrão
// de modais próprios do app). O backend ainda barra apagar a si mesmo/último admin.
// Compartilhada pela lista de usuários (Equipe) e pelo painel de Movimentações.
import { useState } from 'react'
import { Modal } from '../ui'
import { apagarUsuario } from '../../services/usuarios.service'

export interface AlvoApagar {
  user_id: string
  email: string | null
  nome?: string | null
}

export default function ApagarUsuarioModal({ usuario, onClose, onDone, onError }: {
  usuario: AlvoApagar
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [apagando, setApagando] = useState(false)
  const quem = usuario.nome || usuario.email || 'este usuário'

  async function confirmar() {
    setApagando(true)
    try {
      await apagarUsuario(usuario.user_id)
      onDone(`Usuário ${quem} apagado`)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Não foi possível apagar o usuário.')
    } finally {
      setApagando(false)
    }
  }

  return (
    <Modal
      title="Apagar usuário"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={apagando}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={confirmar}
            disabled={apagando}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            {apagando ? 'Apagando…' : 'Apagar definitivamente'}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 'var(--t-base)', lineHeight: 1.5 }}>
        Tem certeza que deseja apagar <strong>{quem}</strong>
        {usuario.email && usuario.nome ? <> (<span className="mono">{usuario.email}</span>)</> : null}?
        <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>
          A conta perde o acesso imediatamente e é removida do sistema e do login.
          Esta ação é <strong>irreversível</strong>. O histórico de ações dela na trilha de auditoria é mantido.
        </div>
      </div>
    </Modal>
  )
}
