// Modal: admin redefine a senha de um usuário direto da lista (sem abrir a edição).
import { useState } from 'react'
import { Modal } from '../ui'
import { redefinirSenhaUsuario } from '../../services/usuarios.service'

export default function ResetSenhaModal({ userId, email, nome, onInformarEmail, onClose, onDone, onError, sobreposta }: {
  /** Nulo = sem conta (profissional "Sem acesso"): a modal é a mesma, mas só
   *  avisa que falta o e-mail, que se informa no Editar. */
  userId: string | null
  email: string | null
  /** Quem é, para o aviso de quem ainda não tem conta. */
  nome?: string
  /** Sem conta: leva à ficha (Editar), onde se informa o e-mail de acesso. */
  onInformarEmail?: () => void
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
  /** Aberta de dentro de outra modal (ficha do profissional). */
  sobreposta?: boolean
}) {
  const [senha, setSenha] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  const semConta = !userId

  async function salvar() {
    if (!userId) return
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
      sobreposta={sobreposta}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          {semConta ? (
            onInformarEmail && <button className="btn btn-primary" onClick={onInformarEmail}>Informar e-mail</button>
          ) : (
            <button className="btn btn-primary" onClick={salvar} disabled={saving || senha.length < 6}>
              {saving ? 'Salvando…' : 'Redefinir'}
            </button>
          )}
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          {semConta ? (
            <><strong style={{ color: 'var(--text)' }}>{nome ?? 'Este profissional'}</strong> ainda não tem e-mail
              de acesso. Informe o e-mail e a senha inicial para criar o acesso.</>
          ) : (
            <>Defina uma nova senha para <strong style={{ color: 'var(--text)' }}>{email ?? 'este usuário'}</strong>.
              Ele passará a entrar com ela.</>
          )}
        </p>
        {!semConta && <div>
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
        </div>}
      </div>
    </Modal>
  )
}
