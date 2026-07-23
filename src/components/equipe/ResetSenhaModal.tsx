// Modal: admin redefine a senha de um usuário direto da lista (sem abrir a edição).
import { useState } from 'react'
import { Modal } from '../ui'
import { redefinirSenhaUsuario } from '../../services/usuarios.service'

export default function ResetSenhaModal({ userId, email, onClose, onDone, onError }: {
  userId: string
  email: string | null
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [senha, setSenha] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (senha.length < 6) { onError('A senha deve ter ao menos 6 caracteres'); return }
    setSaving(true)
    try {
      await redefinirSenhaUsuario(userId, senha)
      onDone('✓ Senha redefinida')
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Redefinir senha"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving || senha.length < 6}>
            {saving ? 'Salvando…' : 'Redefinir'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          Defina uma nova senha para <strong style={{ color: 'var(--text)' }}>{email ?? 'este usuário'}</strong>.
          Ele passará a entrar com ela.
        </p>
        <div>
          <label className="uppercase t-muted" style={{ display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Nova senha *</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} className="bm-input" placeholder="Mínimo de 6 caracteres"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && senha.length >= 6 && !saving) salvar() }}
              autoFocus autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
              {showPw ? 'ocultar' : 'mostrar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
