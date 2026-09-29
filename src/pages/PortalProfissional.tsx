// Portal do profissional: o que médicos e enfermeiros veem ao entrar.
//
// Fica FORA do AppLayout (sem Sidebar nem topbar): a conta de profissional não
// alcança nenhuma tela interna, e montar o layout dispararia as consultas da
// Sidebar, que o backend recusa (403) para esses papéis. O RequireAuth desvia
// para cá qualquer rota autenticada.
//
// A visão é escolhida pelo PAPEL (medico/enfermeiro), não pelo tipo do cadastro:
// hoje as duas são "em breve", mas cada uma tem entrada própria em VISOES para
// poder virar uma tela diferente sem mexer no roteamento.
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { alterarMinhaSenha } from '../services/usuarios.service'
import { Badge } from '../components/ui'

type PapelProfissional = 'medico' | 'enfermeiro'

function EmBreve({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <>
      <span className="portal-eyebrow">{rotulo}</span>
      <h1 className="portal-title">Em breve</h1>
      <p className="portal-lede">{texto}</p>
    </>
  )
}

const VISOES: Record<PapelProfissional, { rotulo: string; render: () => ReactNode }> = {
  medico: {
    rotulo: 'Médico',
    render: () => (
      <EmBreve
        rotulo="Espaço do médico"
        texto="Seu acesso já está ativo. O espaço do médico na BMais está sendo preparado e vai aparecer aqui assim que estiver pronto."
      />
    ),
  },
  enfermeiro: {
    rotulo: 'Enfermeiro',
    render: () => (
      <EmBreve
        rotulo="Espaço do enfermeiro"
        texto="Seu acesso já está ativo. O espaço do enfermeiro na BMais está sendo preparado e vai aparecer aqui assim que estiver pronto."
      />
    ),
  },
}

// A senha inicial é definida pelo administrador; trocar por uma própria é a
// única ação que a conta de profissional tem hoje (POST /api/me/senha vale para
// qualquer papel).
function TrocarSenha() {
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function salvar() {
    if (senha.length < 6) {
      setMsg({ tipo: 'erro', texto: 'A senha deve ter ao menos 6 caracteres.' })
      return
    }
    setSalvando(true)
    setMsg(null)
    try {
      await alterarMinhaSenha(senha)
      setSenha('')
      setAberto(false)
      setMsg({ tipo: 'ok', texto: 'Senha alterada. Use a nova senha no próximo acesso.' })
    } catch {
      setMsg({ tipo: 'erro', texto: 'Não foi possível alterar a senha. Tente de novo em instantes.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="portal-senha">
      {aberto ? (
        <form
          className="portal-senha-form"
          onSubmit={(e) => { e.preventDefault(); if (!salvando) salvar() }}
        >
          <label className="portal-senha-label" htmlFor="portal-nova-senha">Nova senha</label>
          <div className="portal-senha-row">
            <input
              id="portal-nova-senha"
              type="password"
              className="bm-input"
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={salvando || senha.length < 6}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setAberto(false); setSenha(''); setMsg(null) }}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAberto(true); setMsg(null) }}>
          Trocar minha senha
        </button>
      )}
      {msg && (
        <p className={`portal-senha-msg ${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>
      )}
    </div>
  )
}

export default function PortalProfissional({ papel }: { papel: PapelProfissional }) {
  const { nome, username, logout } = useAuth()
  const visao = VISOES[papel]
  const exibido = nome || username || ''

  return (
    <div className="portal">
      <header className="portal-bar">
        <div className="portal-brand">
          <div className="sb-brand-mark">B+</div>
          <div>
            <div className="portal-brand-name">BMais</div>
            <div className="portal-brand-sub">Intelligence System</div>
          </div>
        </div>
        <div className="portal-user">
          <div className="portal-user-id">
            <span className="portal-user-name" title={username ?? undefined}>{exibido}</span>
            <Badge variant="info">{visao.rotulo}</Badge>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="portal-main">
        <section className="portal-card">
          {exibido && <p className="portal-hello">Olá, {exibido}</p>}
          {visao.render()}
          <TrocarSenha />
        </section>
      </main>
    </div>
  )
}
