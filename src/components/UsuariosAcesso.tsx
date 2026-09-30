// Seção de gestão de usuários de acesso (contas de login), exibida na tela Equipe.
// Distinto dos profissionais (E/M/O): aqui são as contas que autenticam, com
// papel admin/diretor/gestor/analista. Visível para administrador e analista interno.
// Criar/editar acontecem em PÁGINAS dedicadas (/usuarios/novo, /usuarios/:id).
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { podeGerirConta, podeGerirOperacoes } from '../auth/permissions'
import type { Usuario, UserRole } from '../types/api'
import { Badge, LoadingState } from './ui'
import Toast from './Toast'
import ResetSenhaModal from './equipe/ResetSenhaModal'
import ApagarUsuarioModal from './equipe/ApagarUsuarioModal'
import { ConfirmarModal } from './ConfirmarModal'
import MenuAcoes, { IconesAcao } from './MenuAcoes'
import { useUsuarios } from '../hooks/useUsuarios'
import { useTodosHospitais } from '../hooks/useEquipe'
import { useDefinirAtivoUsuario } from '../hooks/useAuditoria'
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
const IconLimpar = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
)

type Situacao = 'todas' | 'ativas' | 'suspensas'
type Escopo = 'todos' | 'restrito' | 'livre'

// Busca sem acento nem caixa: "joao" acha "João".
function normalizar(s: string | null | undefined): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export default function UsuariosAcesso() {
  const { role, username } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Filtros vivem na URL (?nivel=&situacao=&escopo=&q=) para sobreviver à ida à
  // página de edição: ela volta para `voltar`, que é esta URL com tudo junto.
  const [params, setParams] = useSearchParams()
  const setParam = (chave: string, valor: string | null) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    if (valor == null || valor === '') next.delete(chave)
    else next.set(chave, valor)
    return next
  }, { replace: true })
  const nivelUrl = (params.get('nivel') as UserRole | null) ?? 'todos'
  const situacao = (['ativas', 'suspensas'].includes(params.get('situacao') ?? '') ? params.get('situacao') : 'todas') as Situacao
  const escopo = (['restrito', 'livre'].includes(params.get('escopo') ?? '') ? params.get('escopo') : 'todos') as Escopo
  const busca = params.get('q') ?? ''
  const irPara = (rota: string) => navigate(rota, { state: { voltar: location.pathname + location.search } })
  // Usuário cuja senha está sendo redefinida na modal (null = fechada).
  const [resetAlvo, setResetAlvo] = useState<Usuario | null>(null)
  // Usuário a ser apagado (modal de confirmação). null = fechada.
  const [apagarAlvo, setApagarAlvo] = useState<Usuario | null>(null)
  // Usuário a suspender/reativar (modal de confirmação). null = fechada.
  const [ativoAlvo, setAtivoAlvo] = useState<Usuario | null>(null)
  const [erroAtivo, setErroAtivo] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const definirAtivo = useDefinirAtivoUsuario()

  // E-mail do admin logado: a UI oculta apagar/suspender a própria conta (o
  // backend também bloqueia por user_id; aqui só evita oferecer a ação).
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

  // Ordem por nome (quem não tem nome vai para o fim, pelo e-mail).
  const usuarios = [...(data?.usuarios ?? [])].sort((a, b) => {
    if (!!a.nome !== !!b.nome) return a.nome ? -1 : 1
    return (a.nome || a.email || '').localeCompare(b.nome || b.email || '', 'pt-BR')
  })
  const suspenso = (u: Usuario) => u.ativo === false
  const restrito = (u: Usuario) => (u.hospitais?.length ?? 0) > 0

  // Cada filtro menos o de nível: as contagens dos chips de nível refletem a
  // busca e os outros filtros, para mostrar onde estão os resultados.
  const q = normalizar(busca)
  const casaOutros = (u: Usuario) => {
    if (situacao === 'ativas' && suspenso(u)) return false
    if (situacao === 'suspensas' && !suspenso(u)) return false
    if (escopo === 'restrito' && !restrito(u)) return false
    if (escopo === 'livre' && restrito(u)) return false
    if (!q) return true
    return normalizar(u.nome).includes(q) || normalizar(u.email).includes(q)
      || normalizar(ROLE_LABEL[u.role]).includes(q)
  }
  const base = usuarios.filter(casaOutros)
  const contagem = (r: UserRole) => base.filter((u) => u.role === r).length
  // Os chips de nível listam os papéis que existem na lista inteira (não somem
  // enquanto se digita); sem resultado na busca ficam desabilitados.
  const papeisPresentes = ROLES_ORDEM.filter((r) => usuarios.some((u) => u.role === r))
  // Papel da URL que não existe na lista (link antigo, conta apagada, ou
  // administrador para o analista, que não os recebe) vale como "todos".
  const roleFiltro: 'todos' | UserRole = nivelUrl !== 'todos' && papeisPresentes.includes(nivelUrl) ? nivelUrl : 'todos'
  const usuariosVisiveis = base.filter((u) => roleFiltro === 'todos' || u.role === roleFiltro)

  const nSuspensos = usuarios.filter(suspenso).length
  const nRestritos = usuarios.filter(restrito).length
  const filtrando = roleFiltro !== 'todos' || situacao !== 'todas' || escopo !== 'todos' || !!q
  const limparFiltros = () => setParams((prev) => {
    const next = new URLSearchParams(prev)
    for (const k of ['nivel', 'situacao', 'escopo', 'q']) next.delete(k)
    return next
  }, { replace: true })

  async function confirmarAtivo() {
    if (!ativoAlvo) return
    const reativar = suspenso(ativoAlvo)
    setErroAtivo(null)
    try {
      await definirAtivo.mutateAsync({ userId: ativoAlvo.user_id, ativo: reativar })
      setToast(reativar ? '✓ Acesso reativado' : 'Acesso desativado')
      setAtivoAlvo(null)
    } catch (e) {
      setErroAtivo(e instanceof Error ? e.message : 'Não foi possível concluir.')
    }
  }

  return (
    // Sem marginTop/título próprios: isto é uma ABA da tela Operações, e o
    // cabeçalho da página já diz o que é (antes era uma seção empilhada).
    <div>
      <div className="ops-toolbar">
        <div className="ops-search">
          {IconSearch}
          <input
            className="bm-input"
            placeholder="Buscar por nome, e-mail ou nível"
            value={busca}
            onChange={(e) => setParam('q', e.target.value)}
          />
          {busca && (
            <button type="button" className="ops-search-limpar" onClick={() => setParam('q', null)}
              aria-label="Limpar busca" title="Limpar busca">{IconLimpar}</button>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => irPara('/usuarios/novo')} style={{ flexShrink: 0 }}>
          {IconPlus}
          Novo usuário
        </button>
      </div>

      {/* Filtros numa linha própria, cada um com rótulo: antes o nível dividia a
          barra com a busca e, com 6 papéis, empurrava o botão para fora. */}
      <div className="uac-filtros">
        {papeisPresentes.length > 1 && (
          <div className="uac-filtro">
            <span className="uac-filtro-rotulo">Nível</span>
            <div className="ops-seg" role="group" aria-label="Filtrar por nível">
              {(['todos', ...papeisPresentes] as const).map((r) => {
                const n = r === 'todos' ? base.length : contagem(r)
                return (
                  <button
                    key={r}
                    type="button"
                    className={`ops-seg-btn${roleFiltro === r ? ' active' : ''}`}
                    onClick={() => setParam('nivel', r === 'todos' ? null : r)}
                    disabled={n === 0 && r !== 'todos' && roleFiltro !== r}
                  >
                    {r === 'todos' ? 'Todos' : ROLE_LABEL[r]}{' '}
                    <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.65 }}>{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {nSuspensos > 0 && (
          <div className="uac-filtro">
            <span className="uac-filtro-rotulo">Situação</span>
            <div className="ops-seg" role="group" aria-label="Filtrar por situação">
              {([['todas', 'Todas'], ['ativas', 'Ativas'], ['suspensas', 'Desativadas']] as const).map(([v, lbl]) => (
                <button key={v} type="button" className={`ops-seg-btn${situacao === v ? ' active' : ''}`}
                  onClick={() => setParam('situacao', v === 'todas' ? null : v)}>{lbl}</button>
              ))}
            </div>
          </div>
        )}
        {nRestritos > 0 && nRestritos < usuarios.length && (
          <div className="uac-filtro">
            <span className="uac-filtro-rotulo">Hospitais</span>
            <div className="ops-seg" role="group" aria-label="Filtrar por escopo de hospitais">
              {([['todos', 'Todos'], ['restrito', 'Com restrição'], ['livre', 'Veem todos']] as const).map(([v, lbl]) => (
                <button key={v} type="button" className={`ops-seg-btn${escopo === v ? ' active' : ''}`}
                  onClick={() => setParam('escopo', v === 'todos' ? null : v)}>{lbl}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {data && (
        <div className="ops-resumo uac-resumo">
          {filtrando
            ? <><b>{usuariosVisiveis.length}</b> de {usuarios.length} usuários</>
            : <><b>{usuarios.length}</b> usuários</>}
          {nSuspensos > 0 && !filtrando && (
            <><span className="ops-resumo-sep">·</span>{nSuspensos} desativado{nSuspensos === 1 ? '' : 's'}</>
          )}
          {filtrando && (
            <button type="button" className="uac-limpar" onClick={limparFiltros}>Limpar filtros</button>
          )}
        </div>
      )}

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
                {usuariosVisiveis.map((u) => {
                  const propria = (u.email || '').trim().toLowerCase() === meuEmail
                  return (
                    <tr key={u.user_id} className={suspenso(u) ? 'uac-linha-suspensa' : undefined}>
                      <td style={{ fontWeight: 500 }}>{u.nome || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                      <td>{u.email ?? '—'}</td>
                      <td>
                        <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                        {suspenso(u) && <> <Badge variant="warning" dot>Desativado</Badge></>}
                      </td>
                      <td><HospitaisResumo keys={u.hospitais ?? []} nomePorKey={nomePorKey} /></td>
                      <td>
                        {/* Conta de administrador: só o administrador mexe. */}
                        {podeGerirConta(role, u.role) && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
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
                            {/* A própria conta não se desativa nem se apaga. */}
                            {propria ? <span className="menu-acoes-vaga" /> : (
                              <MenuAcoes
                                rotulo={`Mais ações para ${u.nome || u.email}`}
                                itens={[
                                  suspenso(u)
                                    ? { rotulo: 'Reativar acesso', icone: IconesAcao.reativar, onClick: () => { setErroAtivo(null); setAtivoAlvo(u) } }
                                    : { rotulo: 'Desativar acesso', icone: IconesAcao.desativar, onClick: () => { setErroAtivo(null); setAtivoAlvo(u) } },
                                  { rotulo: 'Excluir usuário', icone: IconesAcao.excluir, perigo: true, onClick: () => setApagarAlvo(u) },
                                ]}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {usuariosVisiveis.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>
                      {usuarios.length === 0 ? 'Nenhum usuário.' : (
                        <>Nenhum usuário com esses filtros. <button type="button" className="uac-limpar" onClick={limparFiltros}>Limpar filtros</button></>
                      )}
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
        // A modal já tira a linha da lista e recarrega (ver ApagarUsuarioModal).
        <ApagarUsuarioModal
          usuario={apagarAlvo}
          onClose={() => setApagarAlvo(null)}
          onDone={(msg) => { setApagarAlvo(null); setToast(msg) }}
          onError={(msg) => setToast(msg)}
        />
      )}
      {ativoAlvo && (
        <ConfirmarModal
          titulo={suspenso(ativoAlvo) ? 'Reativar acesso' : 'Desativar acesso'}
          confirmar={suspenso(ativoAlvo) ? 'Reativar acesso' : 'Desativar acesso'}
          perigo={!suspenso(ativoAlvo)}
          ocupado={definirAtivo.isPending}
          onConfirmar={confirmarAtivo}
          onCancelar={() => setAtivoAlvo(null)}
        >
          {suspenso(ativoAlvo) ? (
            <p style={{ margin: 0 }}><strong>{ativoAlvo.nome || ativoAlvo.email}</strong> volta a entrar na plataforma com a senha atual.</p>
          ) : (
            <>
              <p style={{ margin: 0 }}><strong>{ativoAlvo.nome || ativoAlvo.email}</strong> deixa de entrar na plataforma a partir de agora.</p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--t-sm)' }}>A conta e o histórico ficam guardados. Dá para reativar depois pelo mesmo menu.</p>
            </>
          )}
          {erroAtivo && <p className="uac-erro" role="alert">{erroAtivo}</p>}
        </ConfirmarModal>
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
