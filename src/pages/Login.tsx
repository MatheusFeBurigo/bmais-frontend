import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { Spinner } from '../components/ui'

// ── Ícones (inline, sem dependências) ───────────────────────────────────────
function IcoMail() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  )
}
function IcoLock() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
function IcoEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6C3.6 8.5 2 12 2 12s3 8 10 8a9.3 9.3 0 0 0 5.4-1.6" /><path d="m2 2 20 20" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IcoAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  )
}
function IcoShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}
function IcoPulse() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
function IcoLayers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
    </svg>
  )
}
const FEATURES = [
  { ico: <IcoPulse />, title: 'Alertas em tempo real', sub: 'Relatórios vencidos e gatilhos de longa permanência.' },
  { ico: <IcoLayers />, title: 'Visão por operadora', sub: 'SLA, censo e escala consolidados por convênio.' },
  { ico: <IcoShield />, title: 'Acesso seguro', sub: 'Autenticação por e-mail e sessão protegida.' },
]

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const podeEnviar = !!email.trim() && !!password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email.trim(), password, remember)
      // A troca de estado de auth redireciona automaticamente (ver App).
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao entrar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth">
      {/* Painel esquerdo — hero da marca */}
      <aside className="auth-hero">
        <div className="auth-hero-grid" />
        <div className="auth-hero-top">
          <div className="auth-hero-mark">B+</div>
          <div>
            <div className="auth-hero-brand">B+ Auditoria</div>
            <div className="auth-hero-brand-sub">Auditoria hospitalar</div>
          </div>
        </div>

        <div className="auth-hero-mid">
          <span className="auth-hero-eyebrow">Plataforma de gestão</span>
          <h1 className="auth-hero-title">
            Controle total da sua <em>auditoria hospitalar</em>
          </h1>
          <p className="auth-hero-lede">
            Acompanhe internações, relatórios e SLAs por operadora em um só lugar —
            com alertas que antecipam o que precisa de atenção.
          </p>

          <div className="auth-hero-list">
            {FEATURES.map((f) => (
              <div className="auth-hero-feat" key={f.title}>
                <span className="auth-hero-feat-ico">{f.ico}</span>
                <span>
                  <b>{f.title}</b>
                  <br />
                  <span>{f.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-hero-foot">© {new Date().getFullYear()} B+ Auditoria · Todos os direitos reservados</div>
      </aside>

      {/* Painel direito — formulário */}
      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <div className="sb-brand-mark">B+</div>
            <div>
              <div className="fw-6 t-ink" style={{ fontSize: 'var(--t-lg)' }}>B+ Auditoria</div>
              <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Auditoria hospitalar</div>
            </div>
          </div>

          <div className="auth-head">
            <div className="auth-title">Bem-vindo de volta</div>
            <div className="auth-sub">Entre com suas credenciais para continuar.</div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className={`auth-field has-icon${email ? ' is-filled' : ''}`}>
              <input
                className="bm-input"
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                autoFocus
                autoComplete="username"
              />
              <span className="auth-field-ico"><IcoMail /></span>
              <label className="auth-field-label" htmlFor="auth-email">E-mail</label>
            </div>

            <div>
              <div className={`auth-field has-icon${password ? ' is-filled' : ''}`}>
                <input
                  className="bm-input"
                  id="auth-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  autoComplete="current-password"
                />
                <span className="auth-field-ico"><IcoLock /></span>
                <label className="auth-field-label" htmlFor="auth-password">Senha</label>
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  <IcoEye off={showPw} />
                </button>
              </div>
            </div>

            <div className="auth-row-between">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Manter conectado
              </label>
              <button type="button" className="auth-link" onClick={() => setErro('Contate o administrador para redefinir sua senha.')}>
                Esqueceu a senha?
              </button>
            </div>

            {erro && (
              <div className="auth-alert error">
                <IcoAlert />
                <span>{erro}</span>
              </div>
            )}

            <button className="btn btn-primary auth-submit" type="submit" disabled={enviando || !podeEnviar}>
              {enviando ? (
                <>
                  {/* Spinner canônico em variante clara (botão primário escuro).
                      Unifica o antigo .auth-spin hard-coded e ganha o respeito a
                      prefers-reduced-motion do <Spinner>. */}
                  <Spinner size={16} style={{ borderColor: 'rgba(255,255,255,.35)', borderTopColor: '#fff' }} />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="auth-foot-note">
            As contas são criadas pelo administrador. Não tem acesso? Solicite ao seu gestor.
          </div>
        </div>
      </main>
    </div>
  )
}
