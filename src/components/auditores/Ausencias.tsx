// Ausências dos auditores, dentro de Módulo 2 > Auditores (24/11/2026, pedido do usuário: "unifique as telas de
// Auditores com Ausências; em Auditores são tomadas as decisões e aprovações referentes a ausências e falta de
// documentações"). Antes era a tela /modulo-2/ausencias (17/11/2026, migration 0065), que agora abre Auditores
// filtrado em "Decisões pendentes".
//
// AusenciasADecidir    na ficha do auditor, as linhas de ausência do "Para decidir" (Recusar e Aprovar), junto dos
//                      documentos para aprovar (24/11/2026, sem abas; a ficha é para decidir).
// HistoricoAusencias   na ficha, o cartão dos pedidos já decididos.
//
// Quem decide (ACOES.decidirAusencias) aprova ou recusa com motivo, como REGRAS 2.1 do Bloco 2. Aprovado, os
// fechamentos do auditor no dia viram "troca pedida" em Fechamentos, para a coordenação nomear quem vai.
import { useState } from 'react'
import { ConfirmarModal } from '../ConfirmarModal'
import Toast from '../Toast'
import { Badge, Modal } from '../ui'
import { useDecidirAusencia } from '../../hooks/useAusencias'
import { dataBR, dataHora } from '../../lib/datas'
import type { EstadoAusencia, FechamentoDoDia, PedidoAusencia } from '../../services/ausencias.service'

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
  // Curto, para caber na coluna da ficha; "pelo auditor" vai embaixo, com a data.
  cancelado: { rotulo: 'Cancelado', variante: 'muted' },
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const diaDaSemana = (s: string) => {
  const [a, m, d] = s.split('-').map(Number)
  return DIAS[new Date(a, m - 1, d).getDay()]
}
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

type Acao = { tipo: 'aprovar' | 'recusar'; p: PedidoAusencia }

function Botoes({ onAprovar, onRecusar }: { onAprovar: () => void; onRecusar: () => void }) {
  return (
    <div className="aus-acoes">
      <button type="button" className="btn btn-outline btn-sm" onClick={onRecusar}>Recusar</button>
      <button type="button" className="btn btn-primary btn-sm" onClick={onAprovar}>Aprovar</button>
    </div>
  )
}

function Modais({ acao, onFechar, onFeito }: { acao: Acao | null; onFechar: () => void; onFeito: (m: string) => void }) {
  if (acao?.tipo === 'aprovar') return <AprovarModal p={acao.p} onFechar={onFechar} onFeito={onFeito} />
  if (acao?.tipo === 'recusar') return <RecusarModal p={acao.p} onFechar={onFechar} onFeito={onFeito} />
  return null
}

// ── Na ficha do auditor ────────────────────────────────────────────────
// A ficha é para decidir (24/11/2026, pedido do usuário: "essa tela precisa ser mais no sentido de aprovar"):
// as ausências que esperam decisão entram como linhas de "Para decidir" (com os documentos para aprovar); as já
// decididas ficam num cartão de histórico, mais abaixo. Os estilos das linhas (.aud-dec*) são da página.

/** As ausências do auditor que esperam decisão: uma linha cada, com Recusar e Aprovar. */
export function AusenciasADecidir({ pedidos, decide }: { pedidos: PedidoAusencia[]; decide: boolean }) {
  const [acao, setAcao] = useState<Acao | null>(null)
  const [aviso, setAviso] = useState('')
  const feito = (m: string) => { setAcao(null); setAviso(m) }
  return (
    <>
      <style>{estilos}</style>
      {pedidos.map((p) => (
        <div key={p.id} className="aud-dec-item">
          <div className="aud-dec-tipo"><Badge variant="info">Ausência</Badge></div>
          <div className="aud-dec-txt">
            <div className="aud-dec-t">Não vai em {diaDaSemana(p.dia).toLowerCase()}, {dataBR(p.dia)}</div>
            <div className="aud-dec-s">
              {p.motivo}{p.pedido_em ? ` · pedido em ${dataHora(p.pedido_em)}` : ''}
            </div>
            <div className="aud-dec-s">Fechamentos no dia: {p.fechamentos.length ? null : 'nenhum'}</div>
            {p.fechamentos.length > 0 && <Fechamentos l={p.fechamentos} />}
          </div>
          {decide && <Botoes onAprovar={() => setAcao({ tipo: 'aprovar', p })} onRecusar={() => setAcao({ tipo: 'recusar', p })} />}
        </div>
      ))}
      <Modais acao={acao} onFechar={() => setAcao(null)} onFeito={feito} />
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </>
  )
}

/** Os pedidos de ausência já decididos (e os que o auditor cancelou), dos últimos 30 dias em diante. */
export function HistoricoAusencias({ pedidos, disponivel }: { pedidos: PedidoAusencia[]; disponivel: boolean }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <style>{estilos}</style>
      <div className="card-header">
        <div>
          <div className="card-title">Ausências decididas</div>
          <p className="card-sub">Pedidos que ele fez no App (Minha agenda), dos últimos 30 dias em diante.</p>
        </div>
      </div>
      {!disponivel ? <div className="aus-aviso">As ausências ainda não estão disponíveis.</div> : (
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table aud-grade" style={{ minWidth: 600 }}>
            <thead>
              {/* A mesma grade da Documentação na ficha (22% e 24%), para as colunas alinharem. */}
              <tr>
                <th style={{ width: '22%' }}>Dia</th>
                <th style={{ width: '24%' }}>Situação</th>
                <th>Motivo e resposta</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const e = ESTADO[p.estado]
                return (
                  <tr key={p.id}>
                    <td><Dia p={p} /></td>
                    <td>
                      <Badge variant={e.variante}>{e.rotulo}</Badge>
                      {p.decisao && (
                        <div className="aus-sub">
                          {[p.estado === 'cancelado' ? 'pelo auditor' : p.decisao.por_nome && `por ${p.decisao.por_nome}`,
                            p.decisao.em && `em ${dataHora(p.decisao.em)}`].filter(Boolean).join(' ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{p.motivo}</div>
                      {p.decisao?.motivo && <div className="aus-sub">Resposta: {p.decisao.motivo}</div>}
                    </td>
                  </tr>
                )
              })}
              {pedidos.length === 0 && (
                <tr><td colSpan={3} className="aus-vazio">Nenhum pedido decidido nos últimos 30 dias.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
