import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(username.trim(), password)
      // A troca de estado de auth redireciona automaticamente (ver App).
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao entrar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ width: 380, maxWidth: '100%' }}>
        <div style={{ padding: '28px 28px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sb-brand-mark" style={{ width: 40, height: 40 }}>B+</div>
          <div>
            <div className="fw-6 t-ink" style={{ fontSize: 'var(--t-lg)' }}>B+ Auditoria</div>
            <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Controle de auditoria hospitalar</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px 28px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="col" style={{ gap: 5 }}>
            <span className="t-muted fw-6" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em' }}>Usuário</span>
            <input
              className="bm-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>
          <label className="col" style={{ gap: 5 }}>
            <span className="t-muted fw-6" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em' }}>Senha</span>
            <input
              className="bm-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {erro && (
            <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>
              {erro}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={enviando || !username || !password} style={{ justifyContent: 'center', marginTop: 4 }}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
