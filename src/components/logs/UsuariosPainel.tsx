// Painel "Usuários" da tela de Logs (apresentação pura): cada conta com sua
// atividade no período e as ações de controle (ver atividade, editar, senha,
// suspender/reativar, apagar). A página executa as ações; aqui só se desenha.
import type { AuditoriaUsuario } from '../../types/api'
import { Badge, LoadingState } from '../ui'
import { dataHora } from '../../lib/datas'
import { contarCadastros, iniciais, nomeDoUsuario, roleLabel, roleVariant, tempoRelativo } from './logs.model'

const IconKey = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8.5-8.5" /><path d="m16 5 3 3" /><path d="m14 7 3 3" /></svg>
)
const IconMais = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
)

/** Fecha o menu <details> que contém o botão clicado. */
function fechar(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.closest('details')?.removeAttribute('open')
}

function Num({ n, erros }: { n: number; erros?: number }) {
  return (
    <td className={`logs-num${n === 0 ? ' zero' : ''}`}>
      {n}{erros ? <small title="falhas / negadas">{erros} ✕</small> : null}
    </td>
  )
}

export default function UsuariosPainel({
  usuarios, carregando, meuEmail, ocupadoId, periodoLabel, podeGerenciar,
  onVerAtividade, onEditar, onSenha, onSuspender, onReativar, onApagar,
}: {
  usuarios: AuditoriaUsuario[]
  carregando: boolean
  meuEmail: string
  /** user_id com ação em andamento (desabilita os botões daquela linha). */
  ocupadoId: string | null
  periodoLabel: string
  /** false = perfil de observação (analista): a coluna de ações some. */
  podeGerenciar: boolean
  onVerAtividade: (u: AuditoriaUsuario) => void
  onEditar: (u: AuditoriaUsuario) => void
  onSenha: (u: AuditoriaUsuario) => void
  onSuspender: (u: AuditoriaUsuario) => void
  onReativar: (u: AuditoriaUsuario) => void
  onApagar: (u: AuditoriaUsuario) => void
}) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ overflow: 'auto', maxHeight: '62vh' }}>
        <table className="bmais-table logs-usuarios-table" style={{ minWidth: 1120 }}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Papel</th>
              <th>Estado</th>
              <th className="t-right" title={`Movimentações no período (${periodoLabel})`}>Movim.</th>
              <th className="t-right">Relatórios</th>
              <th className="t-right">Censos</th>
              <th className="t-right">Cadastros</th>
              <th style={{ minWidth: 210 }}>Última movimentação</th>
              {podeGerenciar && <th style={{ width: 1 }}></th>}
            </tr>
          </thead>
          <tbody>
            {carregando && usuarios.length === 0 && (
              <tr><td colSpan={podeGerenciar ? 9 : 8}><LoadingState label="Carregando usuários…" size={22} style={{ padding: '28px 8px' }} /></td></tr>
            )}
            {!carregando && usuarios.length === 0 && (
              <tr><td colSpan={podeGerenciar ? 9 : 8} className="logs-vazio">Nenhuma conta cadastrada.</td></tr>
            )}
            {usuarios.map((u) => {
              const nome = nomeDoUsuario(u)
              const souEu = !!u.email && u.email.trim().toLowerCase() === meuEmail
              const suspenso = u.existe && u.ativo === false
              const ocupado = ocupadoId != null && ocupadoId === u.user_id
              const ent = u.por_entidade ?? {}
              const classe = !u.existe ? 'logs-removido' : suspenso ? 'logs-suspenso' : undefined
              return (
                <tr key={u.user_id || u.email || nome} className={classe}>
                  <td>
                    <button type="button" className="logs-user-btn" onClick={() => onVerAtividade(u)}
                      title="Ver a atividade deste usuário na trilha" disabled={!u.user_id}>
                      <span className="logs-user">
                        <span className={`logs-avatar${u.existe ? '' : ' removido'}`}>{iniciais(nome)}</span>
                        <span className="logs-user-txt">
                          <span className="logs-user-nome">{nome}{souEu ? ' (você)' : ''}</span>
                          {u.email && u.nome && <span className="logs-user-email">{u.email}</span>}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td><Badge variant={roleVariant(u.role)}>{roleLabel(u.role)}</Badge></td>
                  <td>
                    {!u.existe
                      ? <Badge variant="muted">Removido</Badge>
                      : suspenso
                        ? <Badge variant="warning" dot>Suspenso</Badge>
                        : <Badge variant="success" dot>Ativo</Badge>}
                  </td>
                  <Num n={u.total} erros={u.erros} />
                  <Num n={ent.relatorio ?? 0} />
                  <Num n={ent.censo ?? 0} />
                  <Num n={contarCadastros(ent)} />
                  {/* Quando foi a última movimentação e qual foi, numa coluna
                      só: as duas leituras andam juntas e sobra espaço para as
                      ações. (Login não é movimentação — fica fora da trilha.) */}
                  <td>
                    {u.ultimo_em ? (
                      <div className="logs-atividade">
                        <span className="logs-atividade-quando" title={dataHora(u.ultimo_em)}>
                          {tempoRelativo(u.ultimo_em)}
                        </span>
                        {u.ultimo_resumo && (
                          <span className="logs-atividade-oque" title={`${dataHora(u.ultimo_em)} · ${u.ultimo_resumo}`}>
                            {u.ultimo_resumo}
                          </span>
                        )}
                      </div>
                    ) : <span style={{ color: 'var(--muted-3)' }}>sem movimentação no período</span>}
                  </td>
                  {podeGerenciar && (
                  <td>
                    {u.existe && u.user_id && (
                      <div className="logs-acoes">
                        <button className="btn btn-outline btn-sm" onClick={() => onEditar(u)} disabled={ocupado}>Editar</button>
                        {/* Ações secundárias num menu: quatro botões por linha
                            empurrariam as colunas de atividade para fora da tela. */}
                        <details className="logs-menu">
                          <summary className="btn btn-outline btn-sm" title="Mais ações" aria-label="Mais ações">
                            {ocupado ? '…' : IconMais}
                          </summary>
                          <div className="logs-menu-pop">
                            <button type="button" onClick={(e) => { fechar(e); onSenha(u) }} disabled={ocupado}>
                              {IconKey} Redefinir senha
                            </button>
                            {!souEu && (suspenso ? (
                              <button type="button" className="ok" onClick={(e) => { fechar(e); onReativar(u) }} disabled={ocupado}>
                                Reativar acesso
                              </button>
                            ) : (
                              <button type="button" className="aviso" onClick={(e) => { fechar(e); onSuspender(u) }} disabled={ocupado}
                                title="Bloqueia o acesso sem apagar a conta (reversível)">
                                Suspender acesso
                              </button>
                            ))}
                            {!souEu && (
                              <button type="button" className="perigo" onClick={(e) => { fechar(e); onApagar(u) }} disabled={ocupado}
                                title="Apagar a conta (irreversível; a trilha permanece)">
                                Apagar conta
                              </button>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="logs-legenda" style={{ padding: '8px 12px 10px' }}>
        Contagens do período selecionado. "Cadastros" soma hospitais, operadoras, equipe e escala.
        {podeGerenciar
          ? ' Suspender bloqueia o acesso na hora e mantém o histórico; apagar remove a conta, mas a trilha dela permanece.'
          : ' Seu perfil é de consulta: a gestão das contas é feita pelo administrador.'}
      </div>
    </div>
  )
}
