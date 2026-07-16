import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import type { UserRole } from '../types/api'

type Mode = 'login' | 'register'

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
function IcoCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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
function IcoUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}
function IcoBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M2 13h20" />
    </svg>
  )
}
function IcoCrown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l4 5 5-7 5 7 4-5-2 13H5L3 6Z" />
    </svg>
  )
}

// Papéis oferecidos no cadastro. A ordem parte do menos privilegiado.
// ATENÇÃO: 'admin' aqui espelha o backend (ROLES_REGISTRO). Se o registro for
// aberto ao público, remova 'admin' daqui e de ROLES_REGISTRO no backend.
const ROLE_OPCOES: Array<{ value: UserRole; label: string; desc: string; ico: () => ReactNode }> = [
  { value: 'analista', label: 'Analista', desc: 'Dados operacionais: internações, relatórios e censos.', ico: IcoUser },
  { value: 'diretor', label: 'Diretor', desc: 'Tudo do analista + Diretoria, Gestor e Equipe.', ico: IcoBriefcase },
  { value: 'admin', label: 'Administrador', desc: 'Acesso total, incluindo ações destrutivas e gestão.', ico: IcoCrown },
]

const FEATURES = [
  { ico: <IcoPulse />, title: 'Alertas em tempo real', sub: 'Relatórios vencidos e gatilhos de longa permanência.' },
  { ico: <IcoLayers />, title: 'Visão por operadora', sub: 'SLA, censo e escala consolidados por convênio.' },
  { ico: <IcoShield />, title: 'Acesso seguro', sub: 'Autenticação por e-mail e sessão protegida.' },
]

// Força de senha: 0–4 a partir de tamanho e diversidade de caracteres.
function forcaSenha(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}
const FORCA_LABEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('analista')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const isRegister = mode === 'register'
  const forca = useMemo(() => forcaSenha(password), [password])
  const podeEnviar =
    !!email.trim() && !!password && (!isRegister || password.length >= 6)

  function trocarModo(next: Mode) {
    if (next === mode) return
    setMode(next)
    setErro(null)
    setSucesso(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    setEnviando(true)
    try {
      if (isRegister) {
        const res = await register(email.trim(), password, role, remember)
        if (res.confirmacao_necessaria) {
          // A sessão não é criada; o usuário precisa confirmar por e-mail.
          setSucesso(
            `Enviamos um link de confirmação para ${res.email || email.trim()}. Confirme o e-mail para acessar.`,
          )
          setPassword('')
          setMode('login')
        }
        // Caso contrário a mudança de estado de auth já redireciona (ver App).
      } else {
        await login(email.trim(), password, remember)
        // A troca de estado de auth redireciona automaticamente (ver App).
      }
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : isRegister
            ? 'Falha ao criar conta'
            : 'Falha ao entrar',
      )
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
            <div className="auth-title">{isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}</div>
            <div className="auth-sub">
              {isRegister
                ? 'Preencha os dados abaixo para começar.'
                : 'Entre com suas credenciais para continuar.'}
            </div>
          </div>

          {/* Alternador */}
          <div className={`auth-switch${isRegister ? ' is-register' : ''}`}>
            <div className="auth-switch-thumb" />
            <button type="button" className={!isRegister ? 'active' : ''} onClick={() => trocarModo('login')}>
              Entrar
            </button>
            <button type="button" className={isRegister ? 'active' : ''} onClick={() => trocarModo('register')}>
              Cadastrar
            </button>
          </div>

          {sucesso && (
            <div className="auth-alert success" style={{ marginBottom: 16 }}>
              <IcoCheck />
              <span>{sucesso}</span>
            </div>
          )}

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
                autoComplete={isRegister ? 'email' : 'username'}
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
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
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

              {isRegister && password.length > 0 && (
                <>
                  <div className="auth-meter">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={`auth-meter-seg${forca >= n ? ` on-${forca}` : ''}`} />
                    ))}
                  </div>
                  <div className="auth-meter-label">
                    {password.length < 6
                      ? 'Mínimo de 6 caracteres'
                      : `Força da senha: ${FORCA_LABEL[forca]}`}
                  </div>
                </>
              )}
            </div>

            {isRegister && (
              <fieldset className="auth-roles">
                <legend className="auth-roles-legend">Tipo de conta</legend>
                {ROLE_OPCOES.map((opt) => {
                  const Ico = opt.ico
                  const ativo = role === opt.value
                  return (
                    <label key={opt.value} className={`auth-role${ativo ? ' is-active' : ''}`}>
                      <input
                        type="radio"
                        name="auth-role"
                        value={opt.value}
                        checked={ativo}
                        onChange={() => setRole(opt.value)}
                      />
                      <span className="auth-role-radio" aria-hidden="true" />
                      <span className="auth-role-ico"><Ico /></span>
                      <span className="auth-role-body">
                        <span className="auth-role-name">{opt.label}</span>
                        <span className="auth-role-desc">{opt.desc}</span>
                      </span>
                    </label>
                  )
                })}
                {role === 'admin' && (
                  <div className="auth-role-warn">
                    <IcoAlert />
                    <span>
                      O administrador tem acesso total, incluindo ações destrutivas.
                      Escolha este nível apenas se for realmente necessário.
                    </span>
                  </div>
                )}
              </fieldset>
            )}

            {!isRegister && (
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
            )}

            {erro && (
              <div className="auth-alert error">
                <IcoAlert />
                <span>{erro}</span>
              </div>
            )}

            <button className="btn btn-primary auth-submit" type="submit" disabled={enviando || !podeEnviar}>
              {enviando ? (
                <>
                  <span className="spin" />
                  {isRegister ? 'Criando conta…' : 'Entrando…'}
                </>
              ) : isRegister ? (
                'Criar conta'
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="auth-foot-note">
            {isRegister ? (
              <>
                Já tem uma conta?{' '}
                <button type="button" onClick={() => trocarModo('login')}>Entrar</button>
              </>
            ) : (
              <>
                Ainda não tem conta?{' '}
                <button type="button" onClick={() => trocarModo('register')}>Criar agora</button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
