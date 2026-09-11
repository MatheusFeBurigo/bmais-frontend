// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/gestor/analista. Visível apenas para administradores.
// Criar/editar acontecem em PÁGINAS dedicadas (/usuarios/novo, /usuarios/:id).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import type { Usuario, UserRole } from '../types/api'
import { Badge, LoadingState } from './ui'
import Toast from './Toast'
import ResetSenhaModal from './equipe/ResetSenhaModal'
import ApagarUsuarioModal from './equipe/ApagarUsuarioModal'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { invalidarPorEvento } from '../lib/invalidation'
import { ROLE_LABEL, ROLE_VARIANT, ROLES_ORDEM } from '../lib/usuarioRoles'

const IconSearch = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
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
  const [busca, setBusca] = useState('')
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
  const q = busca.trim().toLowerCase()
  const usuariosVisiveis = usuarios.filter((u) => {
    if (roleFiltro !== 'todos' && u.role !== roleFiltro) return false
    if (!q) return true
    return (u.nome || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  return (
    // Sem marginTop/título próprios: isto é uma ABA da tela Operações, e o
    // cabeçalho da página já diz o que é (antes era uma seção empilhada).
    <div>
      {/* Barra unica: busca + papel + acao. Antes eram 7 pilulas de papel numa
          fileira que quebrava em duas linhas — com nomes longos ("Administrativo",
          "Analista interno") viravam um amontoado de tags sem hierarquia. Um
          select diz "isto e UM filtro com opcoes" no lugar de 7 botoes soltos. */}
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input
            className="bm-input"
            placeholder="Buscar por nome ou e-mail…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="bm-input"
          value={roleFiltro}
          onChange={(e) => setRoleFiltro(e.target.value as 'todos' | UserRole)}
          style={{ width: 'auto', flexShrink: 0 }}
          aria-label="Filtrar por nível de acesso"
        >
          <option value="todos">Todos os níveis ({usuarios.length})</option>
          {ROLES_ORDEM.map((r) => (
            <option key={r} value={r} disabled={contagem(r) === 0}>
              {ROLE_LABEL[r]} ({contagem(r)})
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/usuarios/novo')} style={{ flexShrink: 0 }}>
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
                    <td>
                      <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      {u.ativo === false && <> <Badge variant="warning" dot>Suspenso</Badge></>}
                    </td>
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
                      {/* A mensagem tem de citar o filtro que de fato esvaziou a
                          lista: com busca ativa e nivel "todos", falar do nivel
                          seria enganoso (e ROLE_LABEL['todos'] nem existe). */}
                      {usuarios.length === 0
                        ? 'Nenhum usuário cadastrado ainda.'
                        : busca.trim()
                          ? `Nenhum usuário corresponde a “${busca.trim()}”${roleFiltro !== 'todos' ? ` no nível ${ROLE_LABEL[roleFiltro]}` : ''}.`
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
            invalidarPorEvento(qc, 'usuariosAlterados')
          }}
          onError={(msg) => setToast(msg)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
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
