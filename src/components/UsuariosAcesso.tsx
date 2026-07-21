// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/gestor/analista. Visível apenas para administradores.
// Criar/editar acontecem em PÁGINAS dedicadas (/usuarios/novo, /usuarios/:id).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../types/api'
import { Badge } from './ui'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { ROLE_LABEL, ROLE_VARIANT } from '../lib/usuarioRoles'

const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)

export default function UsuariosAcesso() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [roleFiltro, setRoleFiltro] = useState<'todos' | UserRole>('todos')

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

      {isLoading && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', padding: '12px 0' }}>Carregando usuários…</div>
      )}
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
            ['analista', `${ROLE_LABEL.analista} (${contagem('analista')})`],
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
            <table className="bmais-table" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Nível de acesso</th>
                  <th>Hospitais</th>
                  <th style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {usuariosVisiveis.map((u) => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 500 }}>{u.email ?? '—'}</td>
                    <td><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td><HospitaisResumo keys={u.hospitais ?? []} nomePorKey={nomePorKey} /></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/usuarios/' + u.user_id)}>Editar</button>
                    </td>
                  </tr>
                ))}
                {usuariosVisiveis.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>
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
