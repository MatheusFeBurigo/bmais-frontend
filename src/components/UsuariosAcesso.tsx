// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/gestor/analista. Visível apenas para administradores.
// Criar/editar acontecem em PÁGINAS dedicadas (/usuarios/novo, /usuarios/:id).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import type { Usuario, UserRole } from '../types/api'
import { Badge, LoadingState, Modal } from './ui'
import Toast from './Toast'
import ResetSenhaModal from './equipe/ResetSenhaModal'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { apagarUsuario } from '../services/usuarios.service'
import { queryKeys } from '../lib/queryKeys'
import { ROLE_LABEL, ROLE_VARIANT } from '../lib/usuarioRoles'

const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)
// Chave: redefinir a senha do usuário.
const IconKey = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8.5-8.5" /><path d="m16 5 3 3" /><path d="m14 7 3 3" /></svg>
)

export default function UsuariosAcesso() {
  const { role, username } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [roleFiltro, setRoleFiltro] = useState<'todos' | UserRole>('todos')
  // Usuário cuja senha está sendo redefinida na modal (null = fechada).
  const [resetAlvo, setResetAlvo] = useState<Usuario | null>(null)
  // Usuário a ser apagado (modal de confirmação). null = fechada.
  const [apagarAlvo, setApagarAlvo] = useState<Usuario | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // E-mail do admin logado: a UI oculta o "Apagar" da própria conta (o backend
  // também bloqueia por user_id; aqui só evita oferecer a ação sem sentido).
  const meuEmail = (username || '').trim().toLowerCase()

  // Só admin gerencia usuários. Para os demais, a seção nem é renderizada.
  const { data, isLoading, isError } = useUsuarios(role === 'admin')
  const { data: hospitais } = useTodosHospitais(role === 'admin')
  const nomePorKey = useMemo(
    () => new Map((hospitais ?? []).map((h) => [h.key, h.nome])),
    [hospitais],
  )

  if (role !== 'admin') return null

  const usuarios = data?.usuarios ?? []
  const contagem = (r: UserRole) => usuarios.filter((u) => u.role === r).length
  const usuariosVisiveis = roleFiltro === 'todos'
    ? usuarios
    : usuarios.filter((u) => u.role === roleFiltro)

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 2 }}>Usuários de acesso</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
            Contas que fazem login na plataforma. Você define e-mail, senha e nível de acesso.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/usuarios/novo')}>
          {IconPlus}
          Novo usuário
        </button>
      </div>

      {isLoading && <LoadingState label="Carregando usuários…" size={22} style={{ padding: '24px 8px' }} />}
      {isError && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--danger)', padding: '12px 0' }}>
          Não foi possível carregar os usuários.
        </div>
      )}

      {data && usuarios.length > 0 && (
        <div className="tab-section" style={{ marginBottom: 10 }}>
          {([
            ['todos', `Todos (${usuarios.length})`],
            ['admin', `${ROLE_LABEL.admin} (${contagem('admin')})`],
            ['diretor', `${ROLE_LABEL.diretor} (${contagem('diretor')})`],
            ['gestor', `${ROLE_LABEL.gestor} (${contagem('gestor')})`],
            ['administrativo', `${ROLE_LABEL.administrativo} (${contagem('administrativo')})`],
            ['tecnico', `${ROLE_LABEL.tecnico} (${contagem('tecnico')})`],
          ] as const).map(([r, lbl]) => (
            <button key={r} className={`tab-sec-btn${roleFiltro === r ? ' active' : ''}`} onClick={() => setRoleFiltro(r)}>{lbl}</button>
          ))}
        </div>
      )}

      {data && (
        <div className="card" style={{ padding: 0 }}>
          {/* Rola internamente (vertical + horizontal) para não empurrar o resto da
              página quando há muitos usuários. Cabeçalho fixo no topo do scroll. */}
          <div style={{ overflow: 'auto', maxHeight: 340 }}>
            <table className="bmais-table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Nível de acesso</th>
                  <th>Hospitais</th>
                  <th style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {usuariosVisiveis.map((u) => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 500 }}>{u.nome || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                    <td>{u.email ?? '—'}</td>
                    <td><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td><HospitaisResumo keys={u.hospitais ?? []} nomePorKey={nomePorKey} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setResetAlvo(u)}
                          title="Redefinir senha"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                        >
                          {IconKey}
                          Senha
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/usuarios/' + u.user_id)}>Editar</button>
                        {(u.email || '').trim().toLowerCase() !== meuEmail && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setApagarAlvo(u)}
                            title="Apagar usuário"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            Apagar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {usuariosVisiveis.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>
                      {usuarios.length === 0
                        ? 'Nenhum usuário cadastrado ainda.'
                        : `Nenhum usuário com o nível ${ROLE_LABEL[roleFiltro as UserRole]}.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resetAlvo && (
        <ResetSenhaModal
          userId={resetAlvo.user_id}
          email={resetAlvo.email}
          onClose={() => setResetAlvo(null)}
          onDone={(msg) => { setResetAlvo(null); setToast(msg) }}
          onError={(msg) => setToast(msg)}
        />
      )}
      {apagarAlvo && (
        <ApagarUsuarioModal
          usuario={apagarAlvo}
          onClose={() => setApagarAlvo(null)}
          onDone={(msg) => {
            setApagarAlvo(null)
            setToast(msg)
            qc.invalidateQueries({ queryKey: queryKeys.usuarios() })
          }}
          onError={(msg) => setToast(msg)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

// Modal de confirmação para apagar uma conta de acesso. Ação irreversível: exige
// um clique de confirmação explícito (não usa window.confirm, seguindo o padrão
// de modais próprios do app). O backend ainda barra apagar a si mesmo/último admin.
function ApagarUsuarioModal({ usuario, onClose, onDone, onError }: {
  usuario: Usuario
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [apagando, setApagando] = useState(false)
  const quem = usuario.nome || usuario.email || 'este usuário'

  async function confirmar() {
    setApagando(true)
    try {
      await apagarUsuario(usuario.user_id)
      onDone(`Usuário ${quem} apagado`)
    } catch (e) {
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
          Esta ação é <strong>irreversível</strong>.
        </div>
      </div>
    </Modal>
  )
}

// Resumo compacto dos hospitais de um usuário na tabela.
function HospitaisResumo({ keys, nomePorKey }: { keys: string[]; nomePorKey: Map<string, string> }) {
  if (keys.length === 0) {
    return <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted-2)' }}>Todos</span>
  }
  const nomes = keys.map((k) => nomePorKey.get(k) || k)
  return (
    <span title={nomes.join(', ')} style={{ fontSize: 'var(--t-sm)' }}>
      {keys.length === 1 ? nomes[0] : `${keys.length} hospitais`}
    </span>
  )
}
