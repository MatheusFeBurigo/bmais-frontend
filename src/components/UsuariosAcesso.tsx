// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/analista. Visível apenas para administradores.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../types/api'
import { Badge, Modal } from './ui'
import { useUsuarios } from '../hooks/useUsuarios'
import { criarUsuario } from '../services/usuarios.service'
import { queryKeys } from '../lib/queryKeys'

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  analista: 'Analista',
}
const ROLE_VARIANT: Record<UserRole, 'danger' | 'info' | 'success'> = {
  admin: 'danger',
  diretor: 'info',
  analista: 'success',
}
const ROLE_DESC: Record<UserRole, string> = {
  admin: 'Acesso total, incluindo gestão de usuários e ações destrutivas.',
  diretor: 'Diretoria, Gestor e Configurações. Não vê Equipe.',
  analista: 'Dados operacionais. Não vê Diretoria nem Equipe.',
}

const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)

export default function UsuariosAcesso({ onToast }: { onToast: (m: string) => void }) {
  const { role } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const qc = useQueryClient()

  // Só admin gerencia usuários. Para os demais, a seção nem é renderizada.
  const { data, isLoading, isError } = useUsuarios(role === 'admin')

  if (role !== 'admin') return null

  const usuarios = data?.usuarios ?? []

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 2 }}>Usuários de acesso</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
            Contas que fazem login na plataforma. Você define e-mail, senha e nível de acesso.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
          {IconPlus}
          Novo usuário
        </button>
      </div>

      {isLoading && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', padding: '12px 0' }}>Carregando usuários…</div>
      )}
      {isError && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)', padding: '12px 0' }}>
          Não foi possível carregar os usuários.
        </div>
      )}

      {data && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="bmais-table" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Nível de acesso</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 500 }}>{u.email ?? '—'}</td>
                    <td><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>
                      Nenhum usuário cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addOpen && (
        <NovoUsuarioModal
          onClose={() => setAddOpen(false)}
          onDone={(msg) => {
            setAddOpen(false)
            onToast(msg)
            qc.invalidateQueries({ queryKey: queryKeys.usuarios() })
          }}
          onError={onToast}
        />
      )}
    </div>
  )
}

// ── Modal: criar usuário de acesso ──────────────────────────────────────────
function NovoUsuarioModal({ onClose, onDone, onError }: {
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [role, setRole] = useState<UserRole>('analista')
  const [saving, setSaving] = useState(false)

  const podeSalvar = email.trim().length > 0 && password.length >= 6

  async function criar() {
    if (!email.trim()) { onError('Informe o e-mail'); return }
    if (password.length < 6) { onError('A senha deve ter ao menos 6 caracteres'); return }
    setSaving(true)
    try {
      await criarUsuario(email, password, role)
      onDone(`✓ Usuário ${email.trim()} criado como ${ROLE_LABEL[role]}`)
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 as const }

  return (
    <Modal
      title="Novo usuário de acesso"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={criar} disabled={saving || !podeSalvar}>
            {saving ? 'Criando…' : 'Criar usuário'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>E-mail *</label>
          <input type="email" className="bm-input" placeholder="usuario@empresa.com"
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="off" />
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Senha *</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} className="bm-input" placeholder="Mínimo de 6 caracteres"
              value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
              {showPw ? 'ocultar' : 'mostrar'}
            </button>
          </div>
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Nível de acesso *</label>
          <div style={{ display: 'grid', gap: 8 }}>
            {(['analista', 'diretor', 'admin'] as const).map((r) => (
              <label key={r} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', cursor: 'pointer',
                border: `1px solid ${role === r ? 'var(--primary)' : 'var(--border-strong)'}`,
                background: role === r ? 'var(--accent-soft)' : 'var(--surface)', borderRadius: 10,
              }}>
                <input type="radio" name="novo-user-role" value={r} checked={role === r}
                  onChange={() => setRole(r)} style={{ marginTop: 3, accentColor: 'var(--primary)' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-base)' }}>{ROLE_LABEL[r]}</span>
                  <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--muted)', lineHeight: 1.4 }}>{ROLE_DESC[r]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
