// Módulo 2 > Ausências (17/11/2026, migration 0065). Pedido do usuário: a agenda
// e as ausências do App do auditor "devidamente implementadas", com a decisão da
// coordenação "na parte de módulos" do portal.
//
// /modulo-2/ausencias  os pedidos de ausência que o médico e o enfermeiro fazem
//                      no App (Minha agenda): primeiro os que esperam decisão,
//                      com os fechamentos do auditor naquele dia; depois os já
//                      decididos (e os que ele mesmo cancelou).
//
// Quem decide (ACOES.decidirAusencias) aprova ou recusa com motivo, como REGRAS
// 2.1 do Bloco 2. Aprovado, os fechamentos do auditor no dia viram "troca
// pedida" em Fechamentos, para a coordenação nomear quem vai.
import { useMemo, useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, LoadingState, Modal } from '../components/ui'
import { useAusencias, useDecidirAusencia } from '../hooks/useAusencias'
import { dataBR, dataHora } from '../lib/datas'
import type { EstadoAusencia, FechamentoDoDia, PedidoAusencia } from '../services/ausencias.service'

const estilos = `
.aus-nome{font-weight:600;color:var(--ink)}
.aus-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.aus-dia{font-weight:600;color:var(--ink);white-space:nowrap}
.aus-fech{font-size:var(--t-sm);color:var(--ink-2);white-space:nowrap}
.aus-fech+.aus-fech{margin-top:2px}
.aus-acoes{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap}
.aus-acoes .btn{white-space:nowrap}
.aus-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.aus-aviso{padding:14px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.aus-lista{margin:8px 0 0;padding-left:18px;font-size:var(--t-sm);color:var(--ink-2)}
.aus-campo{margin-bottom:12px}
.aus-nota{font-size:var(--t-sm);color:var(--muted);margin:4px 0 0}
.aus-erro{font-size:var(--t-sm);color:var(--danger);margin:8px 0 0}
.aus-texto{min-height:72px;resize:vertical;font-family:inherit}
.aus-perigo{background:var(--danger);color:#fff;border-color:var(--danger)}
.aus-perigo:hover:not(:disabled){background:var(--danger-2);border-color:var(--danger-2)}
`

type Variante = 'success' | 'info' | 'danger' | 'muted' | 'warning'

const ESTADO: Record<EstadoAusencia, { rotulo: string; variante: Variante }> = {
  pendente: { rotulo: 'Aguardando', variante: 'warning' },
  aprovado: { rotulo: 'Aprovado', variante: 'success' },
  recusado: { rotulo: 'Recusado', variante: 'danger' },
  cancelado: { rotulo: 'Cancelado pelo auditor', variante: 'muted' },
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const diaDaSemana = (s: string) => {
  const [a, m, d] = s.split('-').map(Number)
  return DIAS[new Date(a, m - 1, d).getDay()]
}
const tipoAuditor = (t: string | null) => (t === 'M' ? 'Médico(a)' : t === 'E' ? 'Enfermeiro(a)' : 'Auditor(a)')
const PAPEL = { medico: 'médico', enfermeiro: 'enfermeiro' } as const
/** Letras do texto (a regra do servidor: recusar exige pelo menos 4). */
const letras = (s: string) => (s.match(/\p{L}/gu) ?? []).length

function Fechamentos({ l }: { l: FechamentoDoDia[] }) {
  if (!l.length) return <span className="aus-sub">nenhum</span>
  return (
    <>
      {l.map((f) => (
        <div key={f.id} className="aus-fech">
          {f.hora} · {f.hospital_nome} · {f.operadora_nome} <span className="aus-sub">(como {PAPEL[f.papel]})</span>
        </div>
      ))}
    </>
  )
}

function Auditor({ p }: { p: PedidoAusencia }) {
  return (
    <>
      <div className="aus-nome">{p.profissional_nome}</div>
      <div className="aus-sub">{tipoAuditor(p.tipo)}</div>
    </>
  )
}

function Dia({ p }: { p: PedidoAusencia }) {
  return (
    <>
      <div className="aus-dia">{diaDaSemana(p.dia)}, {dataBR(p.dia)}</div>
      {p.pedido_em && <div className="aus-sub">pedido em {dataHora(p.pedido_em)}</div>}
    </>
  )
}

// ── Aprovar ─────────────────────────────────────────────────────────────

function AprovarModal({ p, onFechar, onFeito }: {
  p: PedidoAusencia
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const decidir = useDecidirAusencia()
  const [erro, setErro] = useState('')
  function confirmar() {
    setErro('')
    decidir.mutate({ id: p.id, aprovar: true }, {
      onSuccess: (r) => {
        const n = r.fechamentos_afetados ?? p.fechamentos.length
        onFeito(`Ausência aprovada: ${p.profissional_nome}, ${dataBR(p.dia)}${n ? ` · ${n} ${n === 1 ? 'fechamento' : 'fechamentos'} com troca pedida` : ''}`)
      },
      onError: (e) => setErro((e as Error).message || 'Não foi possível aprovar. Tente de novo.'),
    })
  }
  return (
    <ConfirmarModal titulo="Aprovar ausência" confirmar="Aprovar" cancelar="Voltar"
      ocupado={decidir.isPending} onConfirmar={confirmar} onCancelar={onFechar}>
      <div>
        <strong>{p.profissional_nome}</strong> não vai em {diaDaSemana(p.dia).toLowerCase()}, {dataBR(p.dia)}
        {' '}({p.motivo.toLowerCase()}).
      </div>
      {p.fechamentos.length ? (
        <div>
          Os fechamentos dele nesse dia viram <strong>troca pedida</strong> em Fechamentos, para nomear quem vai:
          <ul className="aus-lista">
            {p.fechamentos.map((f) => (
              <li key={f.id}>{f.hora} · {f.hospital_nome} · {f.operadora_nome} (como {PAPEL[f.papel]})</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>Ele não tem fechamento nesse dia.</div>
      )}
      <div className="aus-sub" style={{ marginTop: 0 }}>O auditor recebe a resposta no App.</div>
      {erro && <p className="aus-erro" style={{ margin: 0 }}>{erro}</p>}
    </ConfirmarModal>
  )
}

// ── Recusar ─────────────────────────────────────────────────────────────

function RecusarModal({ p, onFechar, onFeito }: {
  p: PedidoAusencia
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const decidir = useDecidirAusencia()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = letras(motivo) >= 4
  function enviar() {
    if (!pronto) return
    setErro('')
    decidir.mutate({ id: p.id, aprovar: false, motivo: motivo.trim() }, {
      onSuccess: () => onFeito(`Ausência recusada: ${p.profissional_nome}, ${dataBR(p.dia)}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível recusar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Recusar ausência" onClose={decidir.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={decidir.isPending}>Voltar</button>
          <button type="button" className="btn aus-perigo" onClick={enviar} disabled={!pronto || decidir.isPending}>
            {decidir.isPending ? 'Recusando…' : 'Recusar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{p.profissional_nome}</strong> pediu {diaDaSemana(p.dia).toLowerCase()}, {dataBR(p.dia)}
        {' '}({p.motivo.toLowerCase()}). Ele continua na agenda desse dia e vê o motivo no App.
      </p>
      <div className="aus-campo">
        <label className="form-lbl" htmlFor="aus-motivo">Motivo da recusa</label>
        <textarea id="aus-motivo" className="bm-input aus-texto" value={motivo} maxLength={500} autoFocus
          disabled={decidir.isPending} onChange={(e) => setMotivo(e.target.value)} />
        <p className="aus-nota">Obrigatório.</p>
      </div>
      {erro && <p className="aus-erro">{erro}</p>}
    </Modal>
  )
}

// ── A lista ─────────────────────────────────────────────────────────────

type Acao = { tipo: 'aprovar' | 'recusar'; p: PedidoAusencia }

export default function Ausencias() {
  const { data, isLoading, isError, error } = useAusencias()
  const [acao, setAcao] = useState<Acao | null>(null)
  const [aviso, setAviso] = useState('')
  usePageHeader(useMemo(() => ({
    title: 'Ausências',
    subtitle: 'Pedidos de ausência dos auditores, feitos no App',
  }), []))

  if (isLoading) return <LoadingState />
  if (isError || !data) {
    return (
      <div>
        <style>{estilos}</style>
        <div className="card"><div className="aus-vazio">{(error as Error)?.message || 'Não foi possível carregar as ausências.'}</div></div>
      </div>
    )
  }

  const decide = data.pode_decidir && data.disponivel
  const pendentes = data.pedidos.filter((p) => p.estado === 'pendente')
  const outros = data.pedidos.filter((p) => p.estado !== 'pendente')
  const feito = (m: string) => { setAcao(null); setAviso(m) }

  return (
    <div>
      <style>{estilos}</style>
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="aus-aviso">
            As ausências ainda não estão disponíveis neste ambiente: o banco ainda não tem as tabelas de
            ausências.
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Aguardando decisão · {pendentes.length}</div>
            <p className="card-sub">Enquanto o pedido espera, o auditor segue na agenda do dia.</p>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Auditor</th>
                <th>Dia</th>
                <th>Motivo</th>
                <th>Fechamentos no dia</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map((p) => (
                <tr key={p.id}>
                  <td><Auditor p={p} /></td>
                  <td><Dia p={p} /></td>
                  <td>{p.motivo}</td>
                  <td><Fechamentos l={p.fechamentos} /></td>
                  <td>
                    {decide && (
                      <div className="aus-acoes">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setAcao({ tipo: 'recusar', p })}>
                          Recusar
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAcao({ tipo: 'aprovar', p })}>
                          Aprovar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pendentes.length === 0 && (
                <tr><td colSpan={5} className="aus-vazio">Nenhum pedido esperando decisão.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Decididos</div>
            <p className="card-sub">Dos últimos 30 dias em diante, o dia mais recente primeiro.</p>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Auditor</th>
                <th>Dia</th>
                <th>Motivo</th>
                <th>Situação</th>
                <th>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {outros.map((p) => {
                const e = ESTADO[p.estado]
                return (
                  <tr key={p.id}>
                    <td><Auditor p={p} /></td>
                    <td><Dia p={p} /></td>
                    <td>{p.motivo}</td>
                    <td><Badge variant={e.variante}>{e.rotulo}</Badge></td>
                    <td>
                      {p.decisao ? (
                        <>
                          <div className="aus-sub" style={{ marginTop: 0 }}>
                            {[p.decisao.por_nome && `por ${p.decisao.por_nome}`, p.decisao.em && `em ${dataHora(p.decisao.em)}`]
                              .filter(Boolean).join(' ')}
                          </div>
                          {p.decisao.motivo && <div style={{ fontSize: 'var(--t-sm)' }}>{p.decisao.motivo}</div>}
                        </>
                      ) : <span className="aus-sub">—</span>}
                    </td>
                  </tr>
                )
              })}
              {outros.length === 0 && (
                <tr><td colSpan={5} className="aus-vazio">Nenhum pedido decidido nos últimos 30 dias.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {acao?.tipo === 'aprovar' && <AprovarModal p={acao.p} onFechar={() => setAcao(null)} onFeito={feito} />}
      {acao?.tipo === 'recusar' && <RecusarModal p={acao.p} onFechar={() => setAcao(null)} onFeito={feito} />}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
