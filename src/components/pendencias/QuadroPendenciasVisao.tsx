// O desenho da aba Pendências, sem dados nem gravação: a barra (filtro e
// "Nova pendência") e as três colunas, no desenho das de censo (Censos
// atrasados → Aguardando retorno → Censos atualizados). QuadroPendencias o liga
// aos hooks; a réplica da Ajuda usa este mesmo quadro com dados fictícios.
// As resolvidas ficam 30 dias (RESOLVIDAS_DIAS no backend).
import { useState, type ReactNode } from 'react'
import type { Pendencia, SituacaoPendencia } from '../../types/api'
import { ColunaInfo } from '../kanban/ColunaInfo'
import { estilosPendencias } from './pendencias.styles'

type Filtro = 'todas' | 'recebida' | 'pedida'

const COLUNAS: { key: SituacaoPendencia; titulo: string; descricao: string; cor: string; vazio: string }[] = [
  { key: 'pendente', titulo: 'Pendentes', cor: 'var(--info)',
    descricao: 'Pedidas e ainda sem andamento. As vencidas vêm primeiro.',
    vazio: 'Nenhuma pendência esperando.' },
  { key: 'aguardando', titulo: 'Aguardando', cor: 'var(--warning)',
    descricao: 'Quem recebeu já agiu e espera um retorno de fora: um e-mail, uma ligação, um documento.',
    vazio: 'Nenhuma pendência aguardando retorno.' },
  { key: 'resolvida', titulo: 'Resolvidas', cor: 'var(--success)',
    descricao: 'Concluídas nos últimos 30 dias. Reabrir devolve a pendência para Pendentes.',
    vazio: 'Nenhuma pendência resolvida nos últimos 30 dias.' },
]

export function QuadroPendenciasVisao({ pendencias, podePedir, onNova, cartao }: {
  /** Recebidas, pedidas e resolvidas, cada uma com a `relacao` de quem olha. */
  pendencias: Pendencia[]
  podePedir: boolean
  onNova: () => void
  /** O card de cada pendência (o ligado aos dados, ou o da Ajuda). */
  cartao: (p: Pendencia) => ReactNode
}) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const recebidas = pendencias.filter((p) => p.relacao === 'recebida').length
  const pedidas = pendencias.filter((p) => p.relacao === 'pedida').length
  // O filtro só faz sentido para quem tem dos dois lados.
  const comFiltro = recebidas > 0 && pedidas > 0
  const visiveis = comFiltro && filtro !== 'todas' ? pendencias.filter((p) => p.relacao === filtro) : pendencias

  return (
    <>
      <style>{estilosPendencias}</style>
      <div className="pd-barra">
        {comFiltro && (
          <div className="ops-seg" role="group" aria-label="Quais pendências">
            {([['todas', `Todas (${pendencias.length})`], ['recebida', `Para você (${recebidas})`],
              ['pedida', `Que você pediu (${pedidas})`]] as const).map(([k, rotulo]) => (
              <button key={k} type="button" className={`ops-seg-btn${filtro === k ? ' active' : ''}`}
                      aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
                {rotulo}
              </button>
            ))}
          </div>
        )}
        {podePedir && (
          <button type="button" className="btn btn-primary btn-sm pd-nova" onClick={onNova}>
            Nova pendência
          </button>
        )}
      </div>

      {pendencias.length === 0 && (
        <p className="pd-vazio" style={{ marginBottom: 12 }}>
          {podePedir
            ? <>Nenhuma pendência. Use <strong>Nova pendência</strong> para pedir algo a alguém da equipe: um paciente, um e-mail urgente, uma tarefa específica.</>
            : 'Nenhuma pendência para você. Quando o gestor ou o coordenador pedir algo, ela aparece aqui.'}
        </p>
      )}

      <div className="pd-quadro">
        {COLUNAS.map((col) => {
          const itens = visiveis.filter((p) => (p.situacao ?? 'pendente') === col.key)
          return (
            <section className={`kb-col pd-col-${col.key}`} key={col.key} style={{ ['--kb-cor' as string]: col.cor }}>
              <header className="kb-col-head">
                <div className="kb-col-title-row">
                  <span className="kb-col-title">{col.titulo}</span>
                  <ColunaInfo texto={col.descricao} />
                  <span className="kb-col-count">{itens.length}</span>
                </div>
              </header>
              <div className="kb-col-body">
                {itens.map((p) => <div key={p.id}>{cartao(p)}</div>)}
                {itens.length === 0 && <div className="kb-empty">{col.vazio}</div>}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
