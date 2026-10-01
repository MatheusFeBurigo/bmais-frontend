// Convite para trocar a senha definida pelo admin/analista (0048).
//
// Aparece logo depois de entrar enquanto a senha for provisória. "Agora não"
// fecha só nesta sessão: no próximo acesso o convite volta, até o usuário
// escolher uma senha própria (POST /api/me/senha tira a marca no servidor).
import { useState } from 'react'
import { Modal } from './ui'
import { useAuth } from '../auth/AuthContext'
import { alterarMinhaSenha } from '../services/usuarios.service'

const rotulo = {
  display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600,
} as const

export default function SenhaProvisoriaModal() {
  const { senhaProvisoria, senhaTrocada } = useAuth()
  const [dispensada, setDispensada] = useState(false)
  const [senha, setSenha] = useState('')
  const [repetida, setRepetida] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!senhaProvisoria || dispensada) return null

  const curta = senha.length < 6
  const diferente = repetida.length > 0 && repetida !== senha
  const podeSalvar = !curta && repetida === senha && !salvando

  async function salvar() {
    if (!podeSalvar) return
    setSalvando(true)
    setErro(null)
    try {
      await alterarMinhaSenha(senha)
      senhaTrocada()
    } catch {
      setErro('Não foi possível trocar a senha. Tente de novo em instantes.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Crie sua senha"
      onClose={() => setDispensada(true)}
      footer={
        <>
          <button className="btn btn-outline" onClick={() => setDispensada(true)}>Agora não</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!podeSalvar}>
            {salvando ? 'Salvando…' : 'Salvar senha'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          Sua senha foi definida por um administrador. Escolha uma senha só sua.
        </p>
        <div>
          <label className="uppercase t-muted" style={rotulo} htmlFor="senha-provisoria-nova">Nova senha</label>
          <div style={{ position: 'relative' }}>
            <input id="senha-provisoria-nova" type={showPw ? 'text' : 'password'} className="bm-input"
              placeholder="Mínimo de 6 caracteres" value={senha}
              onChange={(e) => setSenha(e.target.value)} autoFocus autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
              {showPw ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <div>
          <label className="uppercase t-muted" style={rotulo} htmlFor="senha-provisoria-repetida">Repita a senha</label>
          <input id="senha-provisoria-repetida" type={showPw ? 'text' : 'password'} className="bm-input"
            value={repetida} onChange={(e) => setRepetida(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvar() }} autoComplete="new-password" />
          {diferente && (
            <p style={{ margin: '6px 0 0', fontSize: 'var(--t-sm)', color: 'var(--danger)' }}>
              As senhas não são iguais.
            </p>
          )}
        </div>
        {erro && <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--danger)' }}>{erro}</p>}
      </div>
    </Modal>
  )
}
