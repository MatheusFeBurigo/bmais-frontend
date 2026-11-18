// Módulo 2 > Agenda de serviços (17/11/2026, migration 0066). Pedido do usuário:
// "prepare o sistema então para que possam ser geradas essas escalas para os
// auditores". No protótipo do Bloco 2 quem monta o posto é o coordenador
// operacional, mas a tela não existia: os postos vinham prontos.
//
// /modulo-2/agenda-de-servicos  os postos de cada auditor: hospital, operadora,
//                               serviço e de quando a quando. É o que o App do
//                               auditor mostra nas abas Senhas, Contas e Visitas,
//                               e o que Fechamentos sugere para cada hospital.
//
// Quem monta (`pode_gerir`, do servidor) lança o posto, troca o auditor a partir
// de um dia (o anterior fica até a véspera), encerra no último dia e desfaz o
// posto que ainda não começou. Nada se apaga: o encerrado fica na aba Encerrados.
// Glossário do Bloco 2: "agenda de serviços" e "posto", nunca "escala". Os serviços
// com os nomes do protótipo: Senhas, Contas, Visitas (17/11/2026).
import { useMemo, useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, LoadingState, Modal } from '../components/ui'
import {
  useDesfazerPosto, useEncerrarPosto, useLancarPosto, usePostos, useTrocarPosto,
} from '../hooks/usePostos'
import { dataBR } from '../lib/datas'
import type { ListaPostos, PessoaOpcao, Posto, SituacaoPosto, TipoDia } from '../services/postos.service'

const estilos = `
.ags-filtros{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.ags-seg{display:inline-flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;background:var(--surface)}
.ags-seg button{border:0;background:none;padding:6px 12px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.ags-seg button+button{border-left:1px solid var(--border)}
.ags-seg button.ativo{background:var(--surface-3);color:var(--ink);font-weight:600}
.ags-filtros select{max-width:220px}
.ags-busca{flex:1 1 200px;max-width:300px}
.ags-nome{font-weight:600;color:var(--ink)}
.ags-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.ags-periodo{white-space:nowrap;font-variant-numeric:tabular-nums}
.ags-acoes{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:nowrap}
.ags-acoes .btn{white-space:nowrap}
.ags-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.ags-aviso{padding:14px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.ags-campo{margin-bottom:12px}
.ags-dupla{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ags-nota{font-size:var(--t-sm);color:var(--muted);margin:4px 0 0}
.ags-erro{font-size:var(--t-sm);color:var(--danger);margin:8px 0 0}
.ags-texto{min-height:64px;resize:vertical;font-family:inherit}
.ags-opc{font-weight:400;text-transform:none}
`

type Variante = 'success' | 'info' | 'danger' | 'muted' | 'warning'
type Aba = 'vigente' | 'futuro' | 'encerrado'

const ABAS: [Aba, string][] = [['vigente', 'Vigentes'], ['futuro', 'Vão começar'], ['encerrado', 'Encerrados']]
const SITUACAO: Record<SituacaoPosto, { rotulo: string; variante: Variante }> = {
  vigente: { rotulo: 'Vigente', variante: 'success' },
  futuro: { rotulo: 'Vai começar', variante: 'info' },
  encerrado: { rotulo: 'Encerrado', variante: 'muted' },
  desfeito: { rotulo: 'Desfeito', variante: 'muted' },
}
const VAZIO: Record<Aba, string> = {
  vigente: 'Nenhum posto vale hoje.',
  futuro: 'Nenhum posto marcado para começar.',
  encerrado: 'Nenhum posto encerrado.',
}

const tipoAuditor = (t: string | null) => (t === 'M' ? 'Médico(a)' : t === 'E' ? 'Enfermeiro(a)' : 'Auditor(a)')
/** Sem acento e sem caixa, para a busca. */
const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ontem = (s: string) => {
  const [a, m, d] = s.split('-').map(Number)
  const x = new Date(a, m - 1, d - 1)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const descreve = (p: Posto) => `${p.hospital_nome} · ${p.operadora_nome} · ${p.servico_nome.toLowerCase()}`

function Periodo({ p }: { p: Posto }) {
  return (
    <div className="ags-periodo">
      <div>{p.data_inicio ? `desde ${dataBR(p.data_inicio)}` : 'desde antes da agenda'}</div>
      <div className="ags-sub">{p.data_fim ? `até ${dataBR(p.data_fim)}` : 'sem data de fim'}</div>
    </div>
  )
}

function SelectPessoa({ id, valor, opcoes, nenhum, disabled, onChange }: {
  id: string
  valor: number | null
  opcoes: PessoaOpcao[]
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

// ── Lançar posto ────────────────────────────────────────────────────────

function LancarModal({ lista, onFechar, onFeito }: {
  lista: ListaPostos
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const lancar = useLancarPosto()
  const { hospitais, servicos, tipos_dia, medicos, enfermeiros } = lista.opcoes
  const [hospital, setHospital] = useState(hospitais[0]?.key ?? '')
  const h = hospitais.find((x) => x.key === hospital)
  const [operadora, setOperadora] = useState(hospitais[0]?.operadoras[0]?.key ?? '')
  const [servico, setServico] = useState('V')
  const [tipoDia, setTipoDia] = useState<TipoDia | ''>('util')
  const [medico, setMedico] = useState<number | null>(null)
  const [enfermeiro, setEnfermeiro] = useState<number | null>(null)
  const [inicio, setInicio] = useState(lista.hoje)
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')
  const senha = servico === 'S'

  function trocaHospital(k: string) {
    setHospital(k)
    const novo = hospitais.find((x) => x.key === k)
    if (!novo?.operadoras.some((o) => o.key === operadora)) setOperadora(novo?.operadoras[0]?.key ?? '')
  }
  const pronto = !!h && !!operadora && !!inicio && (medico !== null || enfermeiro !== null) && (!fim || fim >= inicio)

  function enviar() {
    if (!h || !pronto) return
    setErro('')
    lancar.mutate({
      hospital_key: h.key, operadora_key: operadora, servico, medico_id: medico, enfermeiro_id: enfermeiro,
      data_inicio: inicio, data_fim: fim || null, tipo_dia: senha && tipoDia ? tipoDia : null,
    }, {
      onSuccess: (r) => onFeito(`Posto lançado: ${r.postos.map((p) => p.profissional_nome).join(' e ')} em ${h.nome}, desde ${dataBR(inicio)}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível lançar. Tente de novo.'),
    })
  }

  return (
    <Modal title="Lançar posto" onClose={lancar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={lancar.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || lancar.isPending}>
            {lancar.isPending ? 'Lançando…' : 'Lançar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        O auditor passa a ver o posto no App a partir do primeiro dia.
      </p>
      {hospitais.length === 0 ? (
        <p className="ags-nota">Nenhum hospital com operadora vinculada no cadastro.</p>
      ) : (
        <>
          <div className="ags-campo">
            <label className="form-lbl" htmlFor="ags-hosp">Hospital</label>
            <select id="ags-hosp" className="bm-input bm-select" value={hospital} disabled={lancar.isPending}
              onChange={(e) => trocaHospital(e.target.value)}>
              {hospitais.map((x) => (
                <option key={x.key} value={x.key}>{x.nome}{x.cidade ? ` (${[x.cidade, x.uf].filter(Boolean).join('/')})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="ags-dupla ags-campo">
            <div>
              <label className="form-lbl" htmlFor="ags-op">Operadora</label>
              <select id="ags-op" className="bm-input bm-select" value={operadora} disabled={lancar.isPending}
                onChange={(e) => setOperadora(e.target.value)}>
                {(h?.operadoras ?? []).map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-lbl" htmlFor="ags-serv">Serviço</label>
              <select id="ags-serv" className="bm-input bm-select" value={servico} disabled={lancar.isPending}
                onChange={(e) => setServico(e.target.value)}>
                {servicos.map((s) => <option key={s.codigo} value={s.codigo}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          {senha && (
            <div className="ags-campo">
              <label className="form-lbl" htmlFor="ags-tipo">Tipo de dia</label>
              <select id="ags-tipo" className="bm-input bm-select" value={tipoDia} disabled={lancar.isPending}
                onChange={(e) => setTipoDia(e.target.value as TipoDia | '')}>
                {tipos_dia.map((t) => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
                <option value="">Todos os dias</option>
              </select>
              <p className="ags-nota">O validador do fim de semana pode ser outro: lance um posto para cada tipo de dia.</p>
            </div>
          )}
          <div className="ags-dupla ags-campo">
            <div>
              <label className="form-lbl" htmlFor="ags-med">Médico</label>
              <SelectPessoa id="ags-med" valor={medico} opcoes={medicos} nenhum="Nenhum" disabled={lancar.isPending}
                onChange={setMedico} />
            </div>
            <div>
              <label className="form-lbl" htmlFor="ags-enf">Enfermeiro</label>
              <SelectPessoa id="ags-enf" valor={enfermeiro} opcoes={enfermeiros} nenhum="Nenhum" disabled={lancar.isPending}
                onChange={setEnfermeiro} />
            </div>
          </div>
          <div className="ags-dupla ags-campo">
            <div>
              <label className="form-lbl" htmlFor="ags-ini">Primeiro dia</label>
              <input id="ags-ini" type="date" className="bm-input" value={inicio} disabled={lancar.isPending}
                onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <label className="form-lbl" htmlFor="ags-fim">Último dia <span className="ags-opc">(opcional)</span></label>
              <input id="ags-fim" type="date" className="bm-input" value={fim} min={inicio || undefined}
                disabled={lancar.isPending} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <p className="ags-nota">Escolha o médico, o enfermeiro ou os dois. Sem último dia, o posto vale até ser encerrado.</p>
        </>
      )}
      {erro && <p className="ags-erro">{erro}</p>}
    </Modal>
  )
}

// ── Trocar o auditor ────────────────────────────────────────────────────

function TrocarModal({ p, lista, onFechar, onFeito }: {
  p: Posto
  lista: ListaPostos
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const trocar = useTrocarPosto()
  const medico = p.profissional_tipo === 'M'
  const opcoes = (medico ? lista.opcoes.medicos : lista.opcoes.enfermeiros).filter((o) => o.id !== p.profissional_id)
  const minimo = p.data_inicio && p.data_inicio > lista.hoje ? p.data_inicio : lista.hoje
  const [quem, setQuem] = useState<number | null>(null)
  const [entra, setEntra] = useState(minimo)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = quem !== null && !!entra && (!p.data_fim || entra <= p.data_fim)

  function enviar() {
    if (quem === null || !pronto) return
    setErro('')
    trocar.mutate({ id: p.id, profissional_id: quem, a_partir_de: entra, motivo: motivo.trim() || null }, {
      onSuccess: (r) => onFeito(`${r.entrou.profissional_nome} entra em ${p.hospital_nome} a partir de ${dataBR(entra)}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível trocar. Tente de novo.'),
    })
  }

  return (
    <Modal title={`Trocar ${medico ? 'médico' : 'enfermeiro'}`} onClose={trocar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={trocar.isPending}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || trocar.isPending}>
            {trocar.isPending ? 'Trocando…' : 'Trocar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{descreve(p)}</strong>. Hoje está no posto: {p.profissional_nome}.
      </p>
      <div className="ags-campo">
        <label className="form-lbl" htmlFor="ags-quem">Quem entra</label>
        <SelectPessoa id="ags-quem" valor={quem} opcoes={opcoes} nenhum="Escolha" disabled={trocar.isPending}
          onChange={setQuem} />
      </div>
      <div className="ags-campo">
        <label className="form-lbl" htmlFor="ags-entra">A partir de</label>
        <input id="ags-entra" type="date" className="bm-input" value={entra} min={minimo} max={p.data_fim ?? undefined}
          disabled={trocar.isPending} onChange={(e) => setEntra(e.target.value)} />
        <p className="ags-nota">
          {entra && (!p.data_inicio || entra > p.data_inicio)
            ? `${p.profissional_nome} fica no posto até ${dataBR(ontem(entra))}.`
            : `O posto de ${p.profissional_nome} ainda não começou: ele sai da agenda.`}
          {p.data_fim ? ` Quem entra fica até ${dataBR(p.data_fim)}.` : ''}
        </p>
      </div>
      <div className="ags-campo">
        <label className="form-lbl" htmlFor="ags-motivo">Motivo <span className="ags-opc">(opcional)</span></label>
        <textarea id="ags-motivo" className="bm-input ags-texto" value={motivo} maxLength={500}
          disabled={trocar.isPending} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="ags-erro">{erro}</p>}
    </Modal>
  )
}

// ── Encerrar ────────────────────────────────────────────────────────────

function EncerrarModal({ p, lista, onFechar, onFeito }: {
  p: Posto
  lista: ListaPostos
  onFechar: () => void
  onFeito: (msg: string) => void
}) {
  const encerrar = useEncerrarPosto()
  const [ultimo, setUltimo] = useState(p.data_fim ?? lista.hoje)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = !!ultimo && (!p.data_inicio || ultimo >= p.data_inicio)

  function enviar() {
    if (!pronto) return
    setErro('')
    encerrar.mutate({ id: p.id, ultimo_dia: ultimo, motivo: motivo.trim() || null }, {
      onSuccess: () => onFeito(`Posto de ${p.profissional_nome} em ${p.hospital_nome} vai até ${dataBR(ultimo)}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível encerrar. Tente de novo.'),
    })
  }

  return (
    <Modal title="Encerrar posto" onClose={encerrar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={encerrar.isPending}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || encerrar.isPending}>
            {encerrar.isPending ? 'Encerrando…' : 'Encerrar'}
          </button>
        </>
      )}>
      <p style={{ margin: '0 0 12px', fontSize: 'var(--t-sm)', color: 'var(--ink-2)' }}>
        <strong>{p.profissional_nome}</strong> · {descreve(p)}. Depois do último dia o posto sai do App dele e fica em
        Encerrados.
      </p>
      <div className="ags-campo">
        <label className="form-lbl" htmlFor="ags-ultimo">Último dia no posto</label>
        <input id="ags-ultimo" type="date" className="bm-input" value={ultimo} min={p.data_inicio ?? undefined}
          disabled={encerrar.isPending} onChange={(e) => setUltimo(e.target.value)} />
      </div>
      <div className="ags-campo">
        <label className="form-lbl" htmlFor="ags-motivo-enc">Motivo <span className="ags-opc">(opcional)</span></label>
        <textarea id="ags-motivo-enc" className="bm-input ags-texto" value={motivo} maxLength={500}
          disabled={encerrar.isPending} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="ags-erro">{erro}</p>}
    </Modal>
  )
}

// ── Desfazer (posto que ainda não começou) ──────────────────────────────

function DesfazerModal({ p, onFechar, onFeito }: { p: Posto; onFechar: () => void; onFeito: (msg: string) => void }) {
  const desfazer = useDesfazerPosto()
  const [erro, setErro] = useState('')
  function confirmar() {
    setErro('')
    desfazer.mutate(p.id, {
      onSuccess: () => onFeito(`Posto desfeito: ${p.profissional_nome} em ${p.hospital_nome}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível desfazer. Tente de novo.'),
    })
  }
  return (
    <ConfirmarModal titulo="Desfazer posto" confirmar="Desfazer" cancelar="Voltar" perigo
      ocupado={desfazer.isPending} onConfirmar={confirmar} onCancelar={onFechar}>
      <div>
        O posto de <strong>{p.profissional_nome}</strong> ({descreve(p)}) começaria em {dataBR(p.data_inicio)}.
        {' '}Ele sai da agenda antes de começar.
      </div>
      {erro && <p className="ags-erro" style={{ margin: 0 }}>{erro}</p>}
    </ConfirmarModal>
  )
}

// ── A agenda ────────────────────────────────────────────────────────────

type Acao = { tipo: 'trocar' | 'encerrar' | 'desfazer'; p: Posto }

export default function AgendaServicos() {
  const { data, isLoading, isError, error } = usePostos()
  const [aba, setAba] = useState<Aba>('vigente')
  const [servico, setServico] = useState('')
  const [auditor, setAuditor] = useState('')
  const [busca, setBusca] = useState('')
  const [lancando, setLancando] = useState(false)
  const [acao, setAcao] = useState<Acao | null>(null)
  const [aviso, setAviso] = useState('')
  const gerir = !!data?.pode_gerir && !!data?.disponivel

  const acoes = useMemo(() => (gerir ? (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => setLancando(true)}>Lançar posto</button>
  ) : undefined), [gerir])
  usePageHeader(useMemo(() => ({
    title: 'Agenda de serviços',
    subtitle: 'Os postos de cada auditor: hospital, operadora, serviço e de quando a quando',
    actions: acoes,
  }), [acoes]))

  if (isLoading) return <LoadingState />
  if (isError || !data) {
    return (
      <div>
        <style>{estilos}</style>
        <div className="card"><div className="ags-vazio">{(error as Error)?.message || 'Não foi possível carregar a agenda de serviços.'}</div></div>
      </div>
    )
  }

  const todos = data.postos.filter((p) => p.situacao !== 'desfeito')
  const conta = (a: Aba) => todos.filter((p) => p.situacao === a).length
  const auditores = [...new Map(todos.filter((p) => p.profissional_id !== null)
    .map((p) => [String(p.profissional_id), p.profissional_nome ?? ''])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  const q = sem(busca.trim())
  const visiveis = todos.filter((p) => p.situacao === aba && (!servico || p.servico === servico)
    && (!auditor || String(p.profissional_id) === auditor)
    && (!q || sem(p.hospital_nome).includes(q) || sem(p.operadora_nome).includes(q) || sem(p.profissional_nome ?? '').includes(q)))
  const filtrando = !!(servico || auditor || q)
  const feito = (m: string) => { setAcao(null); setLancando(false); setAviso(m) }

  return (
    <div>
      <style>{estilos}</style>
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="ags-aviso">
            A agenda de serviços ainda não tem as datas de início e fim neste banco: dá para consultar os postos de
            hoje, mas lançar, trocar e encerrar ficam para depois da atualização do banco.
          </div>
        </div>
      )}

      <div className="ags-filtros">
        <div className="ags-seg" role="group" aria-label="Situação do posto">
          {ABAS.map(([a, t]) => (
            <button key={a} type="button" className={aba === a ? 'ativo' : ''} aria-pressed={aba === a} onClick={() => setAba(a)}>
              {t} · {conta(a)}
            </button>
          ))}
        </div>
        <select className="bm-input bm-select" value={servico} aria-label="Filtrar por serviço" onChange={(e) => setServico(e.target.value)}>
          <option value="">Todos os serviços</option>
          {data.opcoes.servicos.map((s) => <option key={s.codigo} value={s.codigo}>{s.nome}</option>)}
        </select>
        <select className="bm-input bm-select" value={auditor} aria-label="Filtrar por auditor" onChange={(e) => setAuditor(e.target.value)}>
          <option value="">Todos os auditores</option>
          {auditores.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </select>
        <input className="bm-input ags-busca" placeholder="Buscar hospital, operadora ou auditor" value={busca}
          aria-label="Buscar" onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Operadora</th>
                <th>Serviço</th>
                <th>Auditor</th>
                <th>Período</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="ags-nome">{p.hospital_nome}</div>
                    <div className="ags-sub">{[p.cidade, p.uf].filter(Boolean).join(', ')}</div>
                  </td>
                  <td>{p.operadora_nome}</td>
                  <td>
                    <Badge variant="info">{p.servico_nome}</Badge>
                    {p.servico === 'S' && <div className="ags-sub">{p.tipo_dia_nome ?? 'Todos os dias'}</div>}
                  </td>
                  <td>
                    <div className="ags-nome" style={{ fontWeight: 550 }}>{p.profissional_nome ?? '—'}</div>
                    <div className="ags-sub">{tipoAuditor(p.profissional_tipo)}</div>
                    {!p.profissional_ativo && p.profissional_id !== null && (
                      <div style={{ marginTop: 3 }}><Badge variant="warning">Cadastro inativo</Badge></div>
                    )}
                  </td>
                  <td>
                    <Periodo p={p} />
                    {aba !== 'vigente' && <div style={{ marginTop: 3 }}><Badge variant={SITUACAO[p.situacao].variante}>{SITUACAO[p.situacao].rotulo}</Badge></div>}
                  </td>
                  <td>
                    {gerir && p.situacao !== 'encerrado' && p.profissional_id !== null && (
                      <div className="ags-acoes">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAcao({ tipo: 'trocar', p })}>Trocar</button>
                        {p.situacao === 'futuro' ? (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAcao({ tipo: 'desfazer', p })}>Desfazer</button>
                        ) : (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAcao({ tipo: 'encerrar', p })}>Encerrar</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr><td colSpan={6} className="ags-vazio">{filtrando ? 'Nenhum posto neste filtro.' : VAZIO[aba]}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lancando && <LancarModal lista={data} onFechar={() => setLancando(false)} onFeito={feito} />}
      {acao?.tipo === 'trocar' && <TrocarModal p={acao.p} lista={data} onFechar={() => setAcao(null)} onFeito={feito} />}
      {acao?.tipo === 'encerrar' && <EncerrarModal p={acao.p} lista={data} onFechar={() => setAcao(null)} onFeito={feito} />}
      {acao?.tipo === 'desfazer' && <DesfazerModal p={acao.p} onFechar={() => setAcao(null)} onFeito={feito} />}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
