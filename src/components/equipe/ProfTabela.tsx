// Tabela de profissionais, no mesmo desenho da lista de usuários de acesso
// (UsuariosAcesso): colunas fixas e atalhos na linha (Senha / Editar / Desativar).
//
// Não há "Apagar": profissional só é desativado (tem histórico de escala e a
// conta acompanha o cadastro), e reativar desfaz.
import type { MouseEvent, ReactNode } from 'react'
import type { Profissional } from '../../types/api'
import { Badge } from '../ui'
import { TIPO_LABEL, isAtivo } from './equipe.styles'

const IconKey = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.5 12.5 8.5-8.5" /><path d="m16 5 3 3" /><path d="m14 7 3 3" /></svg>
)

export interface AcoesProf {
  onEditar: (p: Profissional) => void
  onSenha: (p: Profissional) => void
  onAtivo: (p: Profissional) => void
}

export default function ProfTabela({ lista, vazio, onAbrir, acoes }: {
  lista: Profissional[]
  /** Conteúdo da linha única quando a lista está vazia. */
  vazio: ReactNode
  /** Clique na linha abre a ficha. */
  onAbrir: (p: Profissional) => void
  /** Só para quem gere a equipe: coluna de acesso e atalhos. */
  acoes?: AcoesProf
}) {
  // Botões dentro da linha clicável: sem parar o clique, cada atalho abriria
  // a ficha junto.
  const btn = (fn: () => void, title: string, children: ReactNode, perigo?: boolean) => (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={(e: MouseEvent) => { e.stopPropagation(); fn() }}
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', ...(perigo ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}) }}
    >
      {children}
    </button>
  )
  const colunas = acoes ? 5 : 3

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ overflow: 'auto', maxHeight: 35 * 58 + 38 }}>
        <table className="bmais-table" style={{ minWidth: acoes ? 640 : 420 }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              {acoes && <th>E-mail de acesso</th>}
              <th>Hospitais</th>
              {acoes && <th style={{ width: 1 }}></th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const ativo = isAtivo(p)
              return (
                <tr key={p.id} onClick={() => onAbrir(p)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, color: ativo ? undefined : 'var(--muted)' }}>
                    {p.nome}
                    {!ativo && <> <Badge variant="muted">Inativo</Badge></>}
                  </td>
                  <td>{TIPO_LABEL[p.tipo]}</td>
                  {acoes && (
                    <td>{p.acesso_email ?? <span style={{ color: 'var(--muted-2)' }}>Sem acesso</span>}</td>
                  )}
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {p.n_hospitais ? p.n_hospitais : <span style={{ color: 'var(--muted-2)' }}>—</span>}
                  </td>
                  {acoes && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {/* Senha só redefine a senha (mesma modal de Usuários de acesso). */}
                        {btn(() => acoes.onSenha(p), 'Redefinir senha', <>{IconKey}Senha</>)}
                        {btn(() => acoes.onEditar(p), 'Editar profissional', 'Editar')}
                        {ativo
                          ? btn(() => acoes.onAtivo(p), 'Desativar profissional', 'Desativar', true)
                          : btn(() => acoes.onAtivo(p), 'Reativar profissional', 'Reativar')}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={colunas} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 12px' }}>{vazio}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
