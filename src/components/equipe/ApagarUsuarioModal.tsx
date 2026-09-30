// Modal de confirmação para apagar uma conta de acesso. Ação irreversível: exige
// um clique de confirmação explícito (não usa window.confirm, seguindo o padrão
// de modais próprios do app). O backend ainda barra apagar a si mesmo/último admin.
// Compartilhada pela lista de usuários (Equipe) e pelo painel de Movimentações.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'
import { apagarUsuario } from '../../services/usuarios.service'
import { queryKeys } from '../../lib/queryKeys'
import { invalidarPorEvento } from '../../lib/invalidation'
import type { Usuario } from '../../types/api'

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
  const qc = useQueryClient()
  const [apagando, setApagando] = useState(false)
  const quem = usuario.nome || usuario.email || 'este usuário'

  async function confirmar() {
    setApagando(true)
    try {
      await apagarUsuario(usuario.user_id)
      // Tira a linha da lista NA HORA (sem esperar o refetch) e depois confirma
      // com o servidor. Quem chama não precisa lembrar de invalidar nada.
      qc.setQueryData<{ usuarios: Usuario[] }>(queryKeys.usuarios(), (atual) =>
        atual ? { ...atual, usuarios: atual.usuarios.filter((u) => u.user_id !== usuario.user_id) } : atual)
      invalidarPorEvento(qc, 'usuariosAlterados')
      onDone(`Usuário ${quem} apagado`)
    } catch (e) {
      // O backend apaga o perfil ANTES da conta de login: se só a segunda parte
      // falhou, a conta já saiu do sistema. Recarrega a lista para ela refletir
      // isso, em vez de mostrar a linha até alguém dar F5.
      invalidarPorEvento(qc, 'usuariosAlterados')
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
