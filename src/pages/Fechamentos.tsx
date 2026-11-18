// Módulo 2 > Fechamentos (16/11/2026, migration 0063). Pedido do usuário: que a
// aba Contas do App deixe de ser só demonstração; para isso a B+ precisa lançar
// os fechamentos, e a tela fica "na parte de módulos separada no portal".
//
// /modulo-2/fechamentos  a agenda de fechamentos de contas de uma semana (esta,
//                        a próxima ou a seguinte), por dia e hora: hospital,
//                        operadora, quem vai como médico e como enfermeiro (e se
//                        já confirmou no App, ou pediu troca) e quantas contas
//                        já fecharam.
//
// Quem gerencia (ACOES.gerirFechamentos) lança o fechamento com a data que o
// hospital mandou, troca quem vai em cada papel e cancela. Os pares hospital +
// operadora são os da escala P (análise de conta), com o médico e o enfermeiro
// do posto já sugeridos, como `pa-agenda` do protótipo do Bloco 2.
import { useMemo, useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, LoadingState, Modal } from '../components/ui'
import {
  useCancelarFechamento, useFechamentos, useLancarFechamento, useNomearNoFechamento,
} from '../hooks/useFechamentos'
import { dataBR, dataHora } from '../lib/datas'
import type {
  Fechamento, ListaFechamentos, Papel, PessoaNoFechamento, ProfissionalOpcao, SituacaoPapel,
} from '../services/fechamentos.service'

const estilos = `
.fch-filtros{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.fch-seg{display:inline-flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;background:var(--surface)}
.fch-seg button{border:0;background:none;padding:6px 12px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.fch-seg button+button{border-left:1px solid var(--border)}
.fch-seg button.ativo{background:var(--surface-3);color:var(--ink);font-weight:600}
.fch-filtros select{max-width:240px}
.fch-dia td{background:var(--surface-2);font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.06em;
  font-weight:700;color:var(--ink-3);padding-top:9px;padding-bottom:9px}
.fch-dia .badge{margin-left:8px;text-transform:none;letter-spacing:0}
.fch-hora{font-variant-numeric:tabular-nums;font-weight:600;color:var(--ink);white-space:nowrap}
.fch-nome{font-weight:600;color:var(--ink)}
.fch-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.fch-pessoa .badge{margin-top:3px}
.fch-cancelado td{color:var(--muted)}
.fch-cancelado .fch-nome,.fch-cancelado .fch-hora{color:var(--muted);text-decoration:line-through}
.fch-acoes{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap}
.fch-acoes .btn{white-space:nowrap}
.fch-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.fch-aviso{padding:14px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.fch-campo{margin-bottom:12px}
.fch-dupla{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fch-nota{font-size:var(--t-sm);color:var(--muted);margin:4px 0 0}
.fch-erro{font-size:var(--t-sm);color:var(--danger);margin:8px 0 0}
.fch-texto{min-height:64px;resize:vertical;font-family:inherit}
`

type Variante = 'success' | 'info' | 'danger' | 'muted' | 'warning'

const SITUACAO: Record<SituacaoPapel, { rotulo: string; variante: Variante }> = {
  confirmado: { rotulo: 'Confirmado', variante: 'success' },
  aguardando: { rotulo: 'Aguardando confirmação', variante: 'info' },
  troca: { rotulo: 'Troca pedida', variante: 'danger' },
  vazio: { rotulo: '', variante: 'danger' },
}

const PAPEL: Record<Papel, { titulo: string; sem: string; lista: 'medicos' | 'enfermeiros' }> = {
  medico: { titulo: 'médico', sem: 'Sem médico', lista: 'medicos' },
  enfermeiro: { titulo: 'enfermeiro', sem: 'Sem enfermeiro', lista: 'enfermeiros' },
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// ── datas (o dia de parede, sem fuso: AAAA-MM-DD) ───────────────────────

const isoDia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const deIso = (s: string) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d) }
const somaDias = (s: string, n: number) => { const d = deIso(s); d.setDate(d.getDate() + n); return isoDia(d) }
/** Segunda-feira da semana de hoje. */
function segundaDeHoje(): string {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return isoDia(d)
}
const diaDaSemana = (s: string) => DIAS[deIso(s).getDay()]
const diaCurto = (s: string) => dataBR(s).slice(0, 5)

type Semana = 0 | 1 | 2
const ROTULO_SEMANA: Record<Semana, string> = { 0: 'Esta semana', 1: 'Próxima semana', 2: 'Daqui a duas' }

// ── uma pessoa no fechamento ────────────────────────────────────────────

function Pessoa({ p, papel }: { p: PessoaNoFechamento; papel: Papel }) {
  if (p.situacao === 'vazio' || !p.id) {
    return <div className="fch-pessoa"><Badge variant="danger">{PAPEL[papel].sem}</Badge></div>
  }
  const s = SITUACAO[p.situacao]
  return (
    <div className="fch-pessoa">
      <div className="fch-nome" style={{ fontWeight: 550 }}>{p.nome}</div>
      <Badge variant={s.variante}>{s.rotulo}</Badge>
      {p.situacao === 'confirmado' && p.confirmado_em && (
        <div className="fch-sub">em {dataHora(p.confirmado_em)}</div>
      )}
      {p.situacao === 'troca' && p.troca_motivo && <div className="fch-sub">{p.troca_motivo}</div>}
    </div>
  )
}

// ── Lançar fechamento ───────────────────────────────────────────────────

function SelectPessoa({ id, valor, opcoes, nenhum, disabled, onChange }: {
  id: string
  valor: number | null
  opcoes: ProfissionalOpcao[]
  nenhum: string
  disabled?: boolean
  onChange: (v: number | null) => void
}) {
  return (
    <select id={id} className="bm-input bm-select" value={valor ?? ''} disabled={disabled}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{nenhum}</option>
      {opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
    </select>
  )
}

const chavePar = (h: string, o: string) => `${h}|${o}`

function LancarModal({ lista, onFechar, onFeito }: {
  lista: ListaFechamentos
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const lancar = useLancarFechamento()
  const pares = lista.opcoes.pares
  const [par, setPar] = useState(() => (pares[0] ? chavePar(pares[0].hospital_key, pares[0].operadora_key) : ''))
  const atual = pares.find((p) => chavePar(p.hospital_key, p.operadora_key) === par)
  const [data, setData] = useState(lista.hoje)
  const [hora, setHora] = useState('08:00')
  const [medico, setMedico] = useState<number | null>(pares[0]?.medico_id ?? null)
  const [enfermeiro, setEnfermeiro] = useState<number | null>(pares[0]?.enfermeiro_id ?? null)
  const [erro, setErro] = useState('')

  function trocaPar(v: string) {
    setPar(v)
    const p = pares.find((x) => chavePar(x.hospital_key, x.operadora_key) === v)
    // O médico e o enfermeiro do posto P daquele hospital vêm sugeridos.
    setMedico(p?.medico_id ?? null)
    setEnfermeiro(p?.enfermeiro_id ?? null)
  }
  const pronto = !!atual && !!data && data >= lista.hoje && /^\d{2}:\d{2}$/.test(hora)

  function enviar() {
    if (!atual) return
    setErro('')
    lancar.mutate({
      hospital_key: atual.hospital_key, operadora_key: atual.operadora_key, data, hora,
      medico_id: medico, enfermeiro_id: enfermeiro,
    }, {
      onSuccess: () => onFeito(`Fechamento lançado: ${atual.hospital_nome}, ${dataBR(data)} às ${hora}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível lançar. Tente de novo.'),
    })
  }

  return (
    <Modal title="Lançar fechamento" onClose={lancar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={lancar.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || lancar.isPending}>
            {lancar.isPending ? 'Lançando…' : 'Lançar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        A data que o hospital mandou. O médico e o enfermeiro recebem no App para confirmar.
      </p>
      {pares.length === 0 ? (
        <p className="fch-nota">
          Nenhum hospital com posto de análise de conta. Lance o posto de Contas do médico ou do enfermeiro em Agenda de serviços.
        </p>
      ) : (
        <>
          <div className="fch-campo">
            <label className="form-lbl" htmlFor="fch-par">Hospital e operadora</label>
            <select id="fch-par" className="bm-input bm-select" value={par} disabled={lancar.isPending}
              onChange={(e) => trocaPar(e.target.value)}>
              {pares.map((p) => (
                <option key={chavePar(p.hospital_key, p.operadora_key)} value={chavePar(p.hospital_key, p.operadora_key)}>
                  {p.hospital_nome} · {p.operadora_nome}{p.cidade ? ` (${p.cidade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="fch-dupla fch-campo">
            <div>
              <label className="form-lbl" htmlFor="fch-data">Data</label>
              <input id="fch-data" type="date" className="bm-input" value={data} min={lista.hoje}
                disabled={lancar.isPending} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <label className="form-lbl" htmlFor="fch-hora">Hora</label>
              <input id="fch-hora" type="time" className="bm-input" value={hora}
                disabled={lancar.isPending} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>
          <div className="fch-campo">
            <label className="form-lbl" htmlFor="fch-medico">Médico</label>
            <SelectPessoa id="fch-medico" valor={medico} opcoes={lista.opcoes.medicos} nenhum="Ninguém por enquanto"
              disabled={lancar.isPending} onChange={setMedico} />
          </div>
          <div className="fch-campo">
            <label className="form-lbl" htmlFor="fch-enfermeiro">Enfermeiro</label>
            <SelectPessoa id="fch-enfermeiro" valor={enfermeiro} opcoes={lista.opcoes.enfermeiros}
              nenhum="Ninguém por enquanto" disabled={lancar.isPending} onChange={setEnfermeiro} />
            <p className="fch-nota">Vêm sugeridos os do posto deste hospital. Dá para lançar sem um deles e nomear depois.</p>
          </div>
        </>
      )}
      {erro && <p className="fch-erro">{erro}</p>}
    </Modal>
  )
}

// ── Trocar quem vai ─────────────────────────────────────────────────────

function NomearModal({ f, papel, lista, onFechar, onFeito }: {
  f: Fechamento
  papel: Papel
  lista: ListaFechamentos
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const nomear = useNomearNoFechamento()
  const pessoa = f[papel]
  const [quem, setQuem] = useState<number | null>(pessoa.id)
  const [motivo, setMotivo] = useState(pessoa.situacao === 'troca' ? pessoa.troca_motivo ?? '' : '')
  const [erro, setErro] = useState('')
  const opcoes = lista.opcoes[PAPEL[papel].lista]
  const mudou = quem !== pessoa.id

  function enviar() {
    setErro('')
    nomear.mutate({ id: f.id, papel, profissional_id: quem, motivo: motivo.trim() || null }, {
      onSuccess: () => {
        const novo = opcoes.find((o) => o.id === quem)?.nome
        onFeito(novo ? `${novo} vai como ${PAPEL[papel].titulo}` : `${f.hospital_nome}: ficou sem ${PAPEL[papel].titulo}`)
      },
      onError: (e) => setErro((e as Error).message || 'Não foi possível trocar. Tente de novo.'),
    })
  }

  return (
    <Modal title={`Trocar ${PAPEL[papel].titulo}`} onClose={nomear.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={nomear.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!mudou || nomear.isPending}>
            {nomear.isPending ? 'Trocando…' : 'Trocar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{f.hospital_nome}</strong> · {f.operadora_nome} · {diaDaSemana(f.data).toLowerCase()}, {dataBR(f.data)} às {f.hora}.
        {' '}Hoje vai: {pessoa.nome ?? 'ninguém'}.
      </p>
      {pessoa.situacao === 'troca' && (
        <p className="fch-nota" style={{ margin: '0 0 12px' }}>
          {pessoa.nome} pediu troca no App{pessoa.troca_motivo ? `: ${pessoa.troca_motivo.toLowerCase()}` : ''}.
        </p>
      )}
      <div className="fch-campo">
        <label className="form-lbl" htmlFor="fch-quem">Quem vai como {PAPEL[papel].titulo}</label>
        <SelectPessoa id="fch-quem" valor={quem} opcoes={opcoes} nenhum="Ninguém" disabled={nomear.isPending}
          onChange={setQuem} />
        <p className="fch-nota">Quem entra recebe no App e confirma do zero.</p>
      </div>
      <div className="fch-campo">
        <label className="form-lbl" htmlFor="fch-motivo">
          Motivo <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
        </label>
        <textarea id="fch-motivo" className="bm-input fch-texto" value={motivo} maxLength={500}
          disabled={nomear.isPending} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="fch-erro">{erro}</p>}
    </Modal>
  )
}

// ── Cancelar ────────────────────────────────────────────────────────────

function CancelarModal({ f, onFechar, onFeito }: {
  f: Fechamento
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const cancelar = useCancelarFechamento()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  function confirmar() {
    setErro('')
    cancelar.mutate({ id: f.id, motivo: motivo.trim() || null }, {
      onSuccess: () => onFeito(`Fechamento cancelado: ${f.hospital_nome}, ${dataBR(f.data)}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível cancelar. Tente de novo.'),
    })
  }
  return (
    <ConfirmarModal titulo="Cancelar fechamento" confirmar="Cancelar fechamento" cancelar="Voltar" perigo
      ocupado={cancelar.isPending} onConfirmar={confirmar} onCancelar={onFechar}>
      <div>
        <strong>{f.hospital_nome}</strong> · {f.operadora_nome} · {diaDaSemana(f.data).toLowerCase()}, {dataBR(f.data)} às {f.hora}.
        {' '}O fechamento sai do App de quem ia e fica na agenda como cancelado.
      </div>
      <div>
        <label className="form-lbl" htmlFor="fch-motivo-canc">
          Motivo <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
        </label>
        <textarea id="fch-motivo-canc" className="bm-input fch-texto" value={motivo} maxLength={500}
          disabled={cancelar.isPending} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="fch-erro" style={{ margin: 0 }}>{erro}</p>}
    </ConfirmarModal>
  )
}

// ── A agenda ────────────────────────────────────────────────────────────

type Acao = { tipo: 'nomear'; f: Fechamento; papel: Papel } | { tipo: 'cancelar'; f: Fechamento }

function Linha({ f, hoje, gerir, onAcao }: {
  f: Fechamento
  hoje: string
  gerir: boolean
  onAcao: (a: Acao) => void
}) {
  const mexe = gerir && !f.cancelado && f.data >= hoje
  return (
    <tr className={f.cancelado ? 'fch-cancelado' : undefined}>
      <td><span className="fch-hora">{f.hora}</span></td>
      <td>
        <div className="fch-nome">{f.hospital_nome}</div>
        <div className="fch-sub">{[f.cidade, f.uf].filter(Boolean).join(', ')}</div>
        {f.cancelado && (
          <div style={{ marginTop: 3 }}>
            <Badge variant="muted">Cancelado</Badge>
            {f.cancelado_motivo && <div className="fch-sub">{f.cancelado_motivo}</div>}
          </div>
        )}
      </td>
      <td>{f.operadora_nome}</td>
      <td>{f.cancelado ? (f.medico.nome ?? '—') : <Pessoa p={f.medico} papel="medico" />}</td>
      <td>{f.cancelado ? (f.enfermeiro.nome ?? '—') : <Pessoa p={f.enfermeiro} papel="enfermeiro" />}</td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {f.contas.total ? `${f.contas.fechadas} de ${f.contas.total} fechadas` : <span className="fch-sub">nenhuma ainda</span>}
      </td>
      <td>
        {mexe && (
          <div className="fch-acoes">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAcao({ tipo: 'nomear', f, papel: 'medico' })}>
              Trocar médico
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAcao({ tipo: 'nomear', f, papel: 'enfermeiro' })}>
              Trocar enfermeiro
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onAcao({ tipo: 'cancelar', f })}>
              Cancelar
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function Fechamentos() {
  const [semana, setSemana] = useState<Semana>(0)
  const [operadora, setOperadora] = useState('')
  const [lancando, setLancando] = useState(false)
  const [acao, setAcao] = useState<Acao | null>(null)
  const [aviso, setAviso] = useState('')
  const segunda = useMemo(() => segundaDeHoje(), [])
  const de = somaDias(segunda, semana * 7)
  const ate = somaDias(de, 6)
  const { data, isLoading, isError, error } = useFechamentos(de, ate)
  const gerir = !!data?.pode_gerir && !!data?.disponivel

  const acoes = useMemo(() => (gerir ? (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => setLancando(true)}>
      Lançar fechamento
    </button>
  ) : undefined), [gerir])
  usePageHeader(useMemo(() => ({
    title: 'Fechamentos',
    subtitle: 'Agenda de fechamentos de contas: quem vai a cada hospital',
    actions: acoes,
  }), [acoes]))

  const todos = data?.fechamentos ?? []
  const operadoras = [...new Map(todos.map((f) => [f.operadora_key, f.operadora_nome])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  const visiveis = todos.filter((f) => !operadora || f.operadora_key === operadora)
  const dias = [...new Set(visiveis.map((f) => f.data))].sort()
  const hoje = data?.hoje ?? isoDia(new Date())

  const filtros = (
    <div className="fch-filtros">
      <div className="fch-seg" role="group" aria-label="Semana">
        {([0, 1, 2] as Semana[]).map((s) => (
          <button key={s} type="button" className={semana === s ? 'ativo' : ''} aria-pressed={semana === s}
            onClick={() => setSemana(s)}>
            {ROTULO_SEMANA[s]} · {diaCurto(somaDias(segunda, s * 7))} a {diaCurto(somaDias(segunda, s * 7 + 6))}
          </button>
        ))}
      </div>
      <select className="bm-input bm-select" value={operadora} aria-label="Filtrar por operadora"
        onChange={(e) => setOperadora(e.target.value)}>
        <option value="">Todas as operadoras</option>
        {operadoras.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
      </select>
    </div>
  )

  if (isLoading) return <div><style>{estilos}</style>{filtros}<LoadingState /></div>
  if (isError || !data) {
    return (
      <div>
        <style>{estilos}</style>
        {filtros}
        <div className="card"><div className="fch-vazio">{(error as Error)?.message || 'Não foi possível carregar os fechamentos.'}</div></div>
      </div>
    )
  }

  return (
    <div>
      <style>{estilos}</style>
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="fch-aviso">
            Os fechamentos ainda não estão disponíveis neste ambiente: o banco ainda não tem as tabelas de
            fechamentos e contas.
          </div>
        </div>
      )}
      {filtros}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ width: 70 }}>Hora</th>
                <th>Hospital</th>
                <th>Operadora</th>
                <th>Médico</th>
                <th>Enfermeiro</th>
                <th>Contas</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <FragmentoDia key={d} dia={d} hoje={hoje}
                  linhas={visiveis.filter((f) => f.data === d).sort((a, b) => a.hora.localeCompare(b.hora))}
                  gerir={gerir} onAcao={setAcao} />
              ))}
              {dias.length === 0 && (
                <tr>
                  <td colSpan={7} className="fch-vazio">
                    {todos.length === 0 ? 'Nenhum fechamento lançado nesta semana.' : 'Nenhum fechamento desta operadora nesta semana.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lancando && (
        <LancarModal lista={data} onFechar={() => setLancando(false)}
          onFeito={(m) => { setLancando(false); setAviso(m) }} />
      )}
      {acao?.tipo === 'nomear' && (
        <NomearModal f={acao.f} papel={acao.papel} lista={data} onFechar={() => setAcao(null)}
          onFeito={(m) => { setAcao(null); setAviso(m) }} />
      )}
      {acao?.tipo === 'cancelar' && (
        <CancelarModal f={acao.f} onFechar={() => setAcao(null)}
          onFeito={(m) => { setAcao(null); setAviso(m) }} />
      )}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}

function FragmentoDia({ dia, hoje, linhas, gerir, onAcao }: {
  dia: string
  hoje: string
  linhas: Fechamento[]
  gerir: boolean
  onAcao: (a: Acao) => void
}) {
  return (
    <>
      <tr className="fch-dia">
        <td colSpan={7}>
          {diaDaSemana(dia)}, {dataBR(dia)}
          {dia === hoje && <Badge variant="info">hoje</Badge>}
        </td>
      </tr>
      {linhas.map((f) => <Linha key={f.id} f={f} hoje={hoje} gerir={gerir} onAcao={onAcao} />)}
    </>
  )
}
