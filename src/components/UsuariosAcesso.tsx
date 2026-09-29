// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/gestor/analista. Visível para administrador e analista interno.
// Criar/editar acontecem em PÁGINAS dedicadas (/usuarios/novo, /usuarios/:id).
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { podeGerirConta, podeGerirOperacoes } from '../auth/permissions'
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
  const location = useLocation()
  // Nível filtrado fica na URL (?nivel=) para sobreviver à ida à página de
  // edição; a página volta para `voltar`, que é esta URL com aba e nível.
  const [params, setParams] = useSearchParams()
  const nivelUrl = (params.get('nivel') as UserRole | null) ?? 'todos'
  const setRoleFiltro = (r: 'todos' | UserRole) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    if (r === 'todos') next.delete('nivel')
    else next.set('nivel', r)
    return next
  }, { replace: true })
  const irPara = (rota: string) => navigate(rota, { state: { voltar: location.pathname + location.search } })
  const [busca, setBusca] = useState('')
  // Usuário cuja senha está sendo redefinida na modal (null = fechada).
  const [resetAlvo, setResetAlvo] = useState<Usuario | null>(null)
  // Usuário a ser apagado (modal de confirmação). null = fechada.
  const [apagarAlvo, setApagarAlvo] = useState<Usuario | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // E-mail do admin logado: a UI oculta o "Apagar" da própria conta (o backend
  // também bloqueia por user_id; aqui só evita oferecer a ação sem sentido).
  const meuEmail = (username || '').trim().toLowerCase()

  // Admin e analista gerenciam usuários. Para os demais, a seção nem é renderizada.
  const gestor = podeGerirOperacoes(role)
  const { data, isLoading, isError } = useUsuarios(gestor)
  const { data: hospitais } = useTodosHospitais(gestor)
  const nomePorKey = useMemo(
    () => new Map((hospitais ?? []).map((h) => [h.key, h.nome])),
    [hospitais],
  )

  if (!gestor) return null

  const usuarios = data?.usuarios ?? []
  const contagem = (r: UserRole) => usuarios.filter((u) => u.role === r).length
  const papeisPresentes = ROLES_ORDEM.filter((r) => contagem(r) > 0)
  // Papel da URL que não existe na lista (link antigo, conta apagada, ou
  // administrador para o analista, que não os recebe) vale como "todos".
  const roleFiltro: 'todos' | UserRole = nivelUrl !== 'todos' && papeisPresentes.includes(nivelUrl) ? nivelUrl : 'todos'
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
      {/* Barra única: busca + papel + ação. O filtro de papel é o mesmo
          controle segmentado da aba Profissionais e só lista os papéis que
          existem: o select antigo mostrava os 10 papéis com quase todos
          desabilitados (zero contas), e clicar neles não fazia nada. */}
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input
            className="bm-input"
            placeholder="Buscar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {papeisPresentes.length > 1 && (
          <div className="ops-seg" role="group" aria-label="Filtrar por papel">
            {(['todos', ...papeisPresentes] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`ops-seg-btn${roleFiltro === r ? ' active' : ''}`}
                onClick={() => setRoleFiltro(r)}
              >
                {r === 'todos' ? 'Todos' : ROLE_LABEL[r]}{' '}
                <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.65 }}>
                  {r === 'todos' ? usuarios.length : contagem(r)}
                </span>
              </button>
            ))}
          </div>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => irPara('/usuarios/novo')} style={{ flexShrink: 0 }}>
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
          {/* Rola internamente (horizontal sempre, vertical só quando a lista passa
              do teto) para não empurrar o resto da página. Cabeçalho fixo no topo.
              O teto cabe 35 linhas (~58px cada, mais o cabeçalho), que é o quanto a
              tela mostra de uma vez; daí em diante a lista rola por dentro. */}
          <div style={{ overflow: 'auto', maxHeight: 35 * 58 + 38 }}>
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
                      {/* Conta de administrador: só o administrador mexe. */}
                      {podeGerirConta(role, u.role) && (
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
                        <button className="btn btn-outline btn-sm" onClick={() => irPara('/usuarios/' + u.user_id)}>Editar</button>
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
                      )}
                    </td>
                  </tr>
                ))}
                {usuariosVisiveis.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>
                      {usuarios.length === 0 ? 'Nenhum usuário.' : 'Nenhum resultado.'}
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
