// Tabela de movimentações (apresentação pura): uma linha por ação, com detalhe
// expansível. A página cuida de filtros/paginação; aqui só se desenha.
//
// Colunas: quando, quem, papel e o que fez. O id técnico do alvo e o resultado
// HTTP saíram da grade — leitura de sistema, não de negócio: o resumo já diz o
// alvo em texto, a linha de falha continua marcada em vermelho, e o status vive
// no detalhe expandido ("Requisição").
import type { ReactNode } from 'react'
import type { AuditLog } from '../../types/api'
import { Badge, LoadingState } from '../ui'
import { dataHora } from '../../lib/datas'
import {
  alvoDaAcao, entidadeLabel, entidadeVariant, iniciais, nomeDoAutor,
  roleLabel, roleVariant, tempoRelativo,
} from './logs.model'

// Chaves de `detalhes` já contadas no resumo/colunas — não repetimos no expandido.
const OCULTAR = new Set(['internacao_id'])

function Valor({ v }: { v: unknown }): ReactNode {
  if (v === null || v === undefined || v === '') return <span style={{ color: 'var(--muted-3)' }}>—</span>
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'number' || typeof v === 'string') return String(v)
  if (Array.isArray(v) && v.every((x) => typeof x !== 'object' || x === null)) {
    if (v.length === 0) return <span style={{ color: 'var(--muted-3)' }}>nenhum</span>
    return <div className="logs-dv-lista">{v.map((x, i) => <span key={i}>{String(x)}</span>)}</div>
  }
  return <pre>{JSON.stringify(v, null, 2)}</pre>
}

function Detalhe({ log }: { log: AuditLog }) {
  const entradas = Object.entries(log.detalhes ?? {}).filter(([k]) => !OCULTAR.has(k))
  return (
    <tr className="logs-detalhe">
      <td colSpan={4}>
        <div className="logs-detalhe-grid">
          {entradas.map(([k, v]) => (
            <div key={k}>
              <div className="logs-dk">{k.replace(/_/g, ' ')}</div>
              <div className="logs-dv"><Valor v={v} /></div>
            </div>
          ))}
          <div>
            <div className="logs-dk">Requisição</div>
            <div className="logs-dv mono">{log.metodo} {log.rota} → {log.status ?? '—'}</div>
          </div>
          <div>
            <div className="logs-dk">Quando</div>
            <div className="logs-dv mono">{dataHora(log.criado_em)}</div>
          </div>
          <div>
            <div className="logs-dk">Origem</div>
            <div className="logs-dv mono">{log.ip || '—'} · #{log.id}</div>
          </div>
          {log.user_id && (
            <div>
              <div className="logs-dk">Usuário (id)</div>
              <div className="logs-dv mono">{log.user_id}</div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function TabelaAuditoria({
  itens, total, pagina, limite, carregando, atualizando, abertoId,
  onToggle, onPagina, onFiltrarUsuario,
}: {
  itens: AuditLog[]
  total: number
  pagina: number
  limite: number
  carregando: boolean
  atualizando: boolean
  abertoId: number | null
  onToggle: (id: number) => void
  onPagina: (p: number) => void
  onFiltrarUsuario: (userId: string) => void
}) {
  const inicio = total === 0 ? 0 : pagina * limite + 1
  const fim = Math.min(total, (pagina + 1) * limite)
  const ultima = Math.max(0, Math.ceil(total / limite) - 1)

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className={atualizando ? 'logs-atualizando' : undefined} style={{ overflow: 'auto', maxHeight: '62vh' }}>
        <table className="bmais-table logs-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: 120 }}>Quando</th>
              <th style={{ width: 220 }}>Usuário</th>
              <th style={{ width: 110 }}>Papel</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {carregando && itens.length === 0 && (
              <tr><td colSpan={4}><LoadingState label="Carregando movimentações…" size={22} style={{ padding: '28px 8px' }} /></td></tr>
            )}
            {!carregando && itens.length === 0 && (
              <tr><td colSpan={4} className="logs-vazio">Nenhuma movimentação registrada com estes filtros.</td></tr>
            )}
            {itens.map((log) => {
              const aberta = abertoId === log.id
              const autor = nomeDoAutor(log)
              return (
                <LinhaGrupo key={log.id}>
                  <tr
                    className={`logs-row${aberta ? ' aberta' : ''}${log.resultado !== 'ok' ? ' erro' : ''}`}
                    onClick={() => onToggle(log.id)}
                    title={aberta ? 'Recolher detalhes' : 'Ver detalhes'}
                  >
                    <td className="logs-quando">
                      {tempoRelativo(log.criado_em)}
                      <small>{dataHora(log.criado_em)}</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="logs-user-btn"
                        onClick={(e) => { e.stopPropagation(); if (log.user_id) onFiltrarUsuario(log.user_id) }}
                        title={log.user_id ? 'Ver só as ações deste usuário' : undefined}
                        disabled={!log.user_id}
                      >
                        <span className="logs-user">
                          <span className="logs-avatar">{iniciais(autor)}</span>
                          <span className="logs-user-txt">
                            <span className="logs-user-nome">{autor}</span>
                            {log.user_email && log.user_nome && <span className="logs-user-email">{log.user_email}</span>}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td>{log.user_role ? <Badge variant={roleVariant(log.user_role)}>{roleLabel(log.user_role)}</Badge> : <span style={{ color: 'var(--muted-3)' }}>—</span>}</td>
                    <td>
                      <div className="logs-acao">
                        <Badge variant={entidadeVariant(log.entidade)}>{entidadeLabel(log.entidade)}</Badge>
                        <span className="logs-resumo">
                          {log.resumo}
                          {/* Paciente / arquivo de censo / hospital envolvido —
                              o "o quê" ao lado do "quem". */}
                          {alvoDaAcao(log) && <span className="logs-alvo-neg">{alvoDaAcao(log)}</span>}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {aberta && <Detalhe log={log} />}
                </LinhaGrupo>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="logs-pager">
        <span>{total === 0 ? 'Nenhum registro' : `Mostrando ${inicio}–${fim} de ${total}`}</span>
        <div className="logs-pager-btns">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onPagina(pagina - 1)} disabled={pagina <= 0}>Anterior</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onPagina(pagina + 1)} disabled={pagina >= ultima}>Próxima</button>
        </div>
      </div>
    </div>
  )
}

// Fragmento com key — a linha e seu detalhe expansível são irmãos no <tbody>.
function LinhaGrupo({ children }: { children: ReactNode }) {
  return <>{children}</>
}
