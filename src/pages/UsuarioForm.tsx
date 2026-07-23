// Página de criar/editar um usuário de acesso. Uma só página cobre os dois modos:
// sem :id → criar (pede e-mail/senha); com :id → editar (só papel + escopo).
// Substitui as antigas modais de UsuariosAcesso. Admin-only (guard na rota + aqui).
import { useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { rotaFallback } from '../auth/permissions'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import Toast from '../components/Toast'
import MultiSelectHospitais from '../components/MultiSelectHospitais'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { criarUsuario, atualizarUsuario, redefinirSenhaUsuario } from '../services/usuarios.service'
import { queryKeys } from '../lib/queryKeys'
import { ROLE_LABEL, ROLE_DESC, ROLES_ORDEM, temEscopoHospital } from '../lib/usuarioRoles'
import type { UserRole } from '../types/api'

const labelStyle = { display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '.1em', fontWeight: 600 as const }

export default function UsuarioForm() {
  const { id } = useParams<{ id: string }>()
  const editando = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { role: minhaRole } = useAuth()
  const admin = minhaRole === 'admin'

  const { data: usuariosData, isLoading: carregandoUsuarios } = useUsuarios(admin && editando)
  const { data: hospitais } = useTodosHospitais(admin)
  const usuario = editando ? usuariosData?.usuarios.find((u) => u.user_id === id) : undefined

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  // Redefinição de senha na edição (admin): vazia = não altera a senha.
  const [novaSenha, setNovaSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [role, setRole] = useState<UserRole>('administrativo')
  const [hospitaisSel, setHospitaisSel] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Preenche o form ao carregar o usuário (edição). Guarda o id já aplicado para
  // não sobrescrever edições do usuário em re-renders.
  const [aplicado, setAplicado] = useState<string | null>(null)
  if (editando && usuario && aplicado !== usuario.user_id) {
    setNome(usuario.nome ?? '')
    setRole(usuario.role)
    setHospitaisSel(usuario.hospitais ?? [])
    setAplicado(usuario.user_id)
  }

  const titulo = editando ? `Editar ${usuario?.email ?? 'usuário'}` : 'Novo usuário de acesso'
  usePageHeader(
    useMemo(() => ({
      title: titulo,
      subtitle: editando ? 'Papel e escopo de dados da conta' : 'Conta de login: e-mail, senha e nível de acesso',
      actions: (
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/equipe')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Voltar
        </button>
      ),
    }), [titulo, editando, navigate]),
  )

  if (!admin) return <Navigate to={rotaFallback(minhaRole)} replace />
  if (editando && carregandoUsuarios) return <LoadingState label="Carregando usuário…" />
  if (editando && !usuario) return <div className="empty-state">Usuário não encontrado.</div>

  const podeSalvar = editando || (email.trim().length > 0 && password.length >= 6)

  async function salvar() {
    if (!editando) {
      if (!email.trim()) { setToast('Informe o e-mail'); return }
      if (password.length < 6) { setToast('A senha deve ter ao menos 6 caracteres'); return }
    } else if (novaSenha && novaSenha.length < 6) {
      setToast('A nova senha deve ter ao menos 6 caracteres'); return
    }
    setSaving(true)
    try {
      // Só os papéis operacionais (administrativo/técnico) têm escopo por hospital;
      // os demais veem tudo (envia vazio para não deixar uma restrição "invisível" gravada).
      const escopo = temEscopoHospital(role) ? hospitaisSel : []
      if (editando) {
        await atualizarUsuario(id!, { role, hospitais: escopo, nome: nome.trim() })
        // Só redefine a senha se o admin preencheu o campo (vazio = mantém a atual).
        if (novaSenha) await redefinirSenhaUsuario(id!, novaSenha)
      } else {
        await criarUsuario(email, password, role, escopo, nome)
      }
      qc.invalidateQueries({ queryKey: queryKeys.usuarios() })
      navigate('/equipe')  // volta à Equipe com a lista atualizada
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Nome — vale na criação e na edição (exibição amigável). */}
            <div>
              <label className="uppercase t-muted" style={labelStyle}>Nome</label>
              <input type="text" className="bm-input" placeholder="Nome do usuário"
                value={nome} onChange={(e) => setNome(e.target.value)}
                autoFocus={!editando} autoComplete="off" />
            </div>

            {/* E-mail e senha só no cadastro */}
            {!editando && (
              <>
                <div>
                  <label className="uppercase t-muted" style={labelStyle}>E-mail *</label>
                  <input type="email" className="bm-input" placeholder="usuario@empresa.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
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
              </>
            )}

            {/* Redefinir senha — só na edição (admin define a nova senha da conta). */}
            {editando && (
              <div>
                <label className="uppercase t-muted" style={labelStyle}>Redefinir senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showNovaSenha ? 'text' : 'password'} className="bm-input"
                    placeholder="Deixe em branco para manter a senha atual"
                    value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowNovaSenha((v) => !v)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 'var(--t-sm)' }}>
                    {showNovaSenha ? 'ocultar' : 'mostrar'}
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
                  Mínimo de 6 caracteres. O usuário passará a entrar com a nova senha.
                </p>
              </div>
            )}

            {/* Nível de acesso */}
            <div>
              <label className="uppercase t-muted" style={labelStyle}>Nível de acesso *</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {ROLES_ORDEM.map((r) => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', cursor: 'pointer',
                    border: `1px solid ${role === r ? 'var(--primary)' : 'var(--border-strong)'}`,
                    background: role === r ? 'var(--accent-soft)' : 'var(--surface)', borderRadius: 10,
                  }}>
                    <input type="radio" name="user-role" value={r} checked={role === r}
                      onChange={() => setRole(r)} style={{ marginTop: 3, accentColor: 'var(--primary)' }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--t-md)' }}>{ROLE_LABEL[r]}</span>
                      <span style={{ display: 'block', fontSize: 'var(--t-sm)', color: 'var(--muted)', lineHeight: 1.4 }}>{ROLE_DESC[r]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Escopo de dados — só para papéis operacionais (gestor/diretor/admin veem tudo). */}
            {temEscopoHospital(role) && (
              <div>
                <label className="uppercase t-muted" style={labelStyle}>Hospitais (escopo de dados)</label>
                <MultiSelectHospitais hospitais={hospitais ?? []} selecionados={hospitaisSel} onChange={setHospitaisSel} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn btn-outline" onClick={() => navigate('/equipe')}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar} disabled={saving || !podeSalvar}>
              {saving ? (editando ? 'Salvando…' : 'Criando…') : (editando ? 'Salvar' : 'Criar usuário')}
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
