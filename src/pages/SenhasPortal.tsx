// Módulo 2 > Senhas (23/11/2026, migration 0070). Próxima fase do App do auditor: não existe arquivo
// da lista de senhas do portal da operadora, então a B+ copia à mão o que chega. Por ora só o admin
// (decisão do usuário, como o resto do Módulo 2).
//
// /modulo-2/senhas  as senhas solicitadas nos últimos 7 dias. Cadastrada, a senha aparece em
//                   "Para lançar" no App do auditor responsável, com o prazo contado da solicitação.
//                   O lançamento é do auditor, pelo App; aqui a situação muda sozinha quando ele lança.
//
// Ações (REGRAS do Bloco 2, 1.1 e 2.5): cadastrar, redirecionar (motivo obrigatório), lembrete do
// escritório, "saiu do portal sem o lançamento" (pede o lançamento) e remover o cadastro errado.
// Aba Contagem do mês (0071): a conferência manual do mês e a decisão (components/senhas/ContagemMes).
import { useMemo, useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { ConfirmarModal } from '../components/ConfirmarModal'
import Toast from '../components/Toast'
import { Badge, LoadingState, Modal } from '../components/ui'
import {
  useCadastrarSenha, useLembrarSenha, useRedirecionarSenha, useRemoverSenha, useSaiuDoPortal, useSenhasPortal,
} from '../hooks/useSenhasPortal'
import { dataHora } from '../lib/datas'
import ContagemMes from '../components/senhas/ContagemMes'
import type { ListaSenhasPortal, SenhaPortal, SituacaoSenha } from '../services/senhasPortal.service'

const estilos = `
.sp-quadros{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:0 0 14px}
.sp-q{display:flex;flex-direction:column;gap:2px;text-align:left;padding:12px 14px;border-radius:var(--r-md);background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--border);cursor:pointer}
.sp-q b{font-size:24px;font-weight:650;line-height:1.1;color:var(--ink)}
.sp-q small{font-size:var(--t-sm);color:var(--muted)}
.sp-q.on{box-shadow:0 0 0 2px var(--primary)}
.sp-q.crit{border-left-color:var(--danger)}.sp-q.crit b{color:var(--danger)}
.sp-q.warn{border-left-color:var(--warning)}.sp-q.warn b{color:var(--warning)}
.sp-q.ok{border-left-color:var(--success)}.sp-q.ok b{color:var(--success)}
.sp-num{font-family:var(--font-mono,monospace);font-weight:600;color:var(--ink)}
.sp-sub{font-size:var(--t-sm);color:var(--muted);margin-top:2px}
.sp-nome{font-weight:600;color:var(--ink)}
.sp-acoes{display:flex;gap:4px;justify-content:flex-end;flex-wrap:nowrap;white-space:nowrap}
.sp-vazio{padding:28px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
.sp-aviso{padding:14px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.sp-campos{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp-campos .sp-largo{grid-column:1/-1}
.sp-erro{font-size:var(--t-sm);color:var(--danger);margin:10px 0 0}
.sp-abas{display:inline-flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;background:var(--surface);margin:0 0 14px}
.sp-abas button{border:0;background:none;padding:7px 14px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer}
.sp-abas button+button{border-left:1px solid var(--border)}
.sp-abas button[aria-selected="true"]{background:var(--surface-3);color:var(--ink);font-weight:600}
@media (max-width:900px){.sp-quadros{grid-template-columns:repeat(2,minmax(0,1fr))}.sp-campos{grid-template-columns:1fr}}
`

type Variante = 'success' | 'info' | 'danger' | 'muted' | 'warning'
const SIT: Record<SituacaoSenha, { rotulo: string; variante: Variante; quadro: string; cls: string }> = {
  saiu: { rotulo: 'Saiu do portal', variante: 'danger', quadro: 'saíram do portal sem lançamento', cls: 'crit' },
  vencida: { rotulo: 'Vencida', variante: 'danger', quadro: 'vencidas sem lançamento', cls: 'crit' },
  perto: { rotulo: 'Vence logo', variante: 'warning', quadro: 'vencem em até 4 horas', cls: 'warn' },
  pendente: { rotulo: 'Esperando', variante: 'info', quadro: 'esperando o auditor', cls: '' },
  lancada: { rotulo: 'Lançada', variante: 'success', quadro: 'lançadas pelo auditor', cls: 'ok' },
}
const ORDEM: SituacaoSenha[] = ['saiu', 'vencida', 'perto', 'pendente', 'lancada']
const letras = (s: string) => (s.match(/\p{L}/gu) ?? []).length

// ── Cadastrar ───────────────────────────────────────────────────────────

function CadastrarModal({ lista, onFechar, onFeito }: { lista: ListaSenhasPortal; onFechar: () => void; onFeito: (m: string) => void }) {
  const cadastrar = useCadastrarSenha()
  const { postos, operadoras, auditores, origens } = lista.opcoes
  const hospitais = [...new Map(postos.map((p) => [p.hospital_key, p.hospital_nome])).entries()]
  const [hosp, setHosp] = useState(hospitais[0]?.[0] ?? '')
  const opsDoHosp = postos.filter((p) => p.hospital_key === hosp).map((p) => p.operadora_key)
  const [op, setOp] = useState(opsDoHosp[0] ?? operadoras[0]?.key ?? '')
  const [senha, setSenha] = useState('')
  const [paciente, setPaciente] = useState('')
  const [idade, setIdade] = useState('')
  const [sol, setSol] = useState(lista.agora)
  const [origem, setOrigem] = useState(origens[0] ?? '')
  const [quem, setQuem] = useState('')
  const [erro, setErro] = useState('')
  const posto = postos.find((p) => p.hospital_key === hosp && p.operadora_key === op)
  const titular = posto?.sugerido != null ? auditores.find((a) => a.id === posto.sugerido) : undefined
  const formato = operadoras.find((o) => o.key === op)?.formato_texto
  const pronto = !!hosp && !!op && senha.replace(/\D/g, '').length >= 4 && (!!quem || !!titular)

  function trocaHosp(h: string) {
    setHosp(h)
    const o = postos.filter((p) => p.hospital_key === h).map((p) => p.operadora_key)
    if (o.length && !o.includes(op)) setOp(o[0])
  }
  function enviar() {
    if (!pronto || cadastrar.isPending) return
    setErro('')
    cadastrar.mutate({
      hospital_key: hosp, operadora_key: op, senha: senha.trim(), paciente: paciente.trim() || null,
      idade: idade ? Number(idade) : null, solicitada_em: sol || null, origem, profissional_id: quem ? Number(quem) : null,
    }, {
      onSuccess: (r) => onFeito(`Senha ${r.senha.senha} cadastrada: com ${r.senha.responsavel.nome}, no App dele`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível cadastrar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Cadastrar senha" largura={600} onClose={cadastrar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={cadastrar.isPending}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || cadastrar.isPending}>
            {cadastrar.isPending ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </>
      )}>
      {hospitais.length === 0 ? (
        <p className="sp-sub" style={{ margin: 0 }}>Nenhum hospital tem posto de validação de senha. Monte os postos em Agenda de serviços (serviço de senha) e volte aqui.</p>
      ) : (
        <div className="sp-campos">
          <div>
            <label className="form-lbl" htmlFor="sp-hosp">Hospital</label>
            <select id="sp-hosp" className="bm-input bm-select" value={hosp} onChange={(e) => trocaHosp(e.target.value)}>
              {hospitais.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-op">Operadora</label>
            <select id="sp-op" className="bm-input bm-select" value={op} onChange={(e) => setOp(e.target.value)}>
              {operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}{opsDoHosp.includes(o.key) ? '' : ' (sem posto aqui)'}</option>)}
            </select>
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-num">Número da senha</label>
            <input id="sp-num" className="bm-input" inputMode="numeric" autoFocus value={senha} onChange={(e) => setSenha(e.target.value)} />
            {formato && <p className="sp-sub">{formato}</p>}
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-sol">Solicitada em</label>
            <input id="sp-sol" className="bm-input" type="datetime-local" value={sol} max={lista.agora} onChange={(e) => setSol(e.target.value)} />
            <p className="sp-sub">O prazo de {lista.prazo_horas} horas conta daqui.</p>
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-pac">Paciente</label>
            <input id="sp-pac" className="bm-input" value={paciente} placeholder="Como veio do portal" onChange={(e) => setPaciente(e.target.value)} />
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-idade">Idade</label>
            <input id="sp-idade" className="bm-input" inputMode="numeric" value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-origem">De onde veio</label>
            <select id="sp-origem" className="bm-input bm-select" value={origem} onChange={(e) => setOrigem(e.target.value)}>
              {origens.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="form-lbl" htmlFor="sp-quem">Com quem fica</label>
            <select id="sp-quem" className="bm-input bm-select" value={quem} onChange={(e) => setQuem(e.target.value)}>
              <option value="">{titular ? `Titular do posto hoje: ${titular.nome}` : 'Escolha o auditor'}</option>
              {auditores.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
        </div>
      )}
      {erro && <p className="sp-erro">{erro}</p>}
    </Modal>
  )
}

// ── Redirecionar e remover ──────────────────────────────────────────────

function RedirecionarModal({ s, lista, onFechar, onFeito }: { s: SenhaPortal; lista: ListaSenhasPortal; onFechar: () => void; onFeito: (m: string) => void }) {
  const red = useRedirecionarSenha()
  const [para, setPara] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = !!para && letras(motivo) >= 3
  function enviar() {
    if (!pronto) return
    setErro('')
    red.mutate({ id: s.id, profissional_id: Number(para), motivo: motivo.trim() }, {
      onSuccess: (r) => onFeito(`Senha ${s.senha} redirecionada para ${r.senha.responsavel.nome}`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível redirecionar.'),
    })
  }
  return (
    <Modal title="Redirecionar senha" onClose={red.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={red.isPending}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || red.isPending}>{red.isPending ? 'Redirecionando…' : 'Redirecionar'}</button>
        </>
      )}>
      <p className="sp-sub" style={{ margin: '0 0 12px' }}>
        <span className="sp-num">{s.senha}</span> · {s.hospital_nome}. Está com <strong>{s.responsavel.nome}</strong>; quem receber vê no App "Senha redirecionada para você".
      </p>
      <div style={{ marginBottom: 12 }}>
        <label className="form-lbl" htmlFor="sp-para">Para</label>
        <select id="sp-para" className="bm-input bm-select" value={para} onChange={(e) => setPara(e.target.value)}>
          <option value="">Escolha o auditor</option>
          {lista.opcoes.auditores.filter((a) => a.id !== s.responsavel.id).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </div>
      <label className="form-lbl" htmlFor="sp-mot">Motivo</label>
      <input id="sp-mot" className="bm-input" value={motivo} placeholder="Por exemplo: titular sem sinal, posto de apoio" onChange={(e) => setMotivo(e.target.value)} />
      {erro && <p className="sp-erro">{erro}</p>}
    </Modal>
  )
}

function RemoverModal({ s, onFechar, onFeito }: { s: SenhaPortal; onFechar: () => void; onFeito: (m: string) => void }) {
  const rem = useRemoverSenha()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  function confirmar() {
    if (letras(motivo) < 3) { setErro('Escreva o motivo.'); return }
    rem.mutate({ id: s.id, motivo: motivo.trim() }, {
      onSuccess: () => onFeito(`Cadastro da senha ${s.senha} removido`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível remover.'),
    })
  }
  return (
    <ConfirmarModal titulo="Remover o cadastro" confirmar="Remover" cancelar="Voltar" perigo ocupado={rem.isPending}
      onConfirmar={confirmar} onCancelar={onFechar}>
      <div><span className="sp-num">{s.senha}</span> · {s.hospital_nome}. A senha sai do App de {s.responsavel.nome}. O cadastro fica registrado como removido.</div>
      <div>
        <label className="form-lbl" htmlFor="sp-rem">Motivo</label>
        <input id="sp-rem" className="bm-input" value={motivo} placeholder="Por exemplo: número digitado errado" onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro && <p className="sp-erro" style={{ margin: 0 }}>{erro}</p>}
    </ConfirmarModal>
  )
}

// ── A lista ─────────────────────────────────────────────────────────────

type Acao = { tipo: 'redirecionar' | 'remover' | 'saiu'; s: SenhaPortal }

function Linha({ s, gerir, onAcao, onLembrete }: { s: SenhaPortal; gerir: boolean; onAcao: (a: Acao) => void; onLembrete: (s: SenhaPortal) => void }) {
  const sit = SIT[s.situacao]
  const red = s.redirecionamentos.at(-1)
  return (
    <tr>
      <td><Badge variant={sit.variante}>{sit.rotulo}</Badge></td>
      <td>
        <div className="sp-num">{s.senha}</div>
        <div className="sp-sub">{s.operadora_nome}{s.origem ? ` · ${s.origem.toLowerCase()}` : ''}</div>
      </td>
      <td>{s.hospital_nome}</td>
      <td>{s.paciente || '—'}{s.idade != null && <span className="sp-sub"> · {s.idade} anos</span>}</td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div>{dataHora(s.solicitada_em)}</div>
        <div className="sp-sub">prazo {dataHora(s.prazo_em)}</div>
      </td>
      <td>
        <div className="sp-nome">{s.responsavel.nome || '—'}</div>
        {red && <div className="sp-sub">redirecionada de {red.de_nome}: {red.motivo}</div>}
        {s.lembretes.length > 0 && <div className="sp-sub">{s.lembretes.length} {s.lembretes.length === 1 ? 'lembrete' : 'lembretes'}, o último {dataHora(s.lembretes.at(-1)!.em)}</div>}
      </td>
      <td>
        {s.lancamento ? (
          <div style={{ textAlign: 'right' }}>
            <div>{s.lancamento.situacao === 'cancelada' ? 'Cancelada' : 'Validada'} {s.lancamento.no_prazo ? 'no prazo' : 'fora do prazo'}</div>
            <div className="sp-sub">{s.lancamento.por_nome}, {dataHora(s.lancamento.em)}</div>
          </div>
        ) : gerir && (
          <div className="sp-acoes">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onLembrete(s)}>Lembrete</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAcao({ tipo: 'redirecionar', s })}>Redirecionar</button>
            {!s.saiu_do_portal_em && <button type="button" className="btn btn-outline btn-sm" onClick={() => onAcao({ tipo: 'saiu', s })}>Saiu do portal</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAcao({ tipo: 'remover', s })}>Remover</button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function SenhasPortal() {
  const { data, isLoading, isError, error } = useSenhasPortal()
  const lembrar = useLembrarSenha()
  const saiu = useSaiuDoPortal()
  const [cadastrando, setCadastrando] = useState(false)
  const [acao, setAcao] = useState<Acao | null>(null)
  const [filtro, setFiltro] = useState<SituacaoSenha | ''>('')
  const [aviso, setAviso] = useState('')
  const [aba, setAba] = useState<'dia' | 'contagem'>('dia')

  usePageHeader(useMemo(() => ({
    title: 'Senhas',
    subtitle: 'Senhas do dia copiadas do portal da operadora, para o auditor lançar no App',
    actions: aba === 'dia' && data?.pode_gerir && data.disponivel
      ? <button type="button" className="btn btn-primary btn-sm" onClick={() => setCadastrando(true)}>Cadastrar senha</button>
      : undefined,
  }), [aba, data?.pode_gerir, data?.disponivel]))

  const abas = (
    <div className="sp-abas" role="tablist" aria-label="Senhas">
      <button type="button" role="tab" aria-selected={aba === 'dia'} onClick={() => setAba('dia')}>Senhas do dia</button>
      <button type="button" role="tab" aria-selected={aba === 'contagem'} onClick={() => setAba('contagem')}>Contagem do mês</button>
    </div>
  )
  if (aba === 'contagem') {
    return <div><style>{estilos}</style>{abas}<ContagemMes onAviso={setAviso} />{aviso && <Toast message={aviso} onDone={() => setAviso('')} />}</div>
  }

  if (isLoading) return <LoadingState />
  if (isError || !data) {
    return <div><style>{estilos}</style><div className="card"><div className="sp-vazio">{(error as Error)?.message || 'Não foi possível carregar as senhas.'}</div></div></div>
  }
  const n = (sit: SituacaoSenha) => data.senhas.filter((s) => s.situacao === sit).length
  const visiveis = filtro ? data.senhas.filter((s) => s.situacao === filtro) : data.senhas
  const feito = (m: string) => { setAcao(null); setCadastrando(false); setAviso(m) }
  const gerir = data.pode_gerir && data.disponivel

  return (
    <div>
      <style>{estilos}</style>
      {abas}
      {!data.disponivel && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="sp-aviso">As senhas do dia ainda não estão disponíveis neste ambiente: falta a migration 0070 no banco.</div>
        </div>
      )}
      <div className="sp-quadros">
        {ORDEM.map((sit) => (
          <button key={sit} type="button" className={`sp-q ${SIT[sit].cls}${filtro === sit ? ' on' : ''}`} aria-pressed={filtro === sit}
            onClick={() => setFiltro((f) => (f === sit ? '' : sit))}>
            <b>{n(sit)}</b><small>{SIT[sit].quadro}</small>
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="bmais-table" style={{ minWidth: 1000 }}>
            <thead>
              <tr><th>Situação</th><th>Senha</th><th>Hospital</th><th>Paciente</th><th>Solicitada</th><th>Com quem</th><th style={{ width: 1 }} /></tr>
            </thead>
            <tbody>
              {visiveis.map((s) => (
                <Linha key={s.id} s={s} gerir={gerir} onAcao={setAcao}
                  onLembrete={(x) => lembrar.mutate(x.id, { onSuccess: () => setAviso(`Lembrete enviado a ${x.responsavel.nome}`), onError: (e) => setAviso((e as Error).message) })} />
              ))}
              {visiveis.length === 0 && (
                <tr><td colSpan={7} className="sp-vazio">
                  {data.senhas.length === 0 ? 'Nenhuma senha cadastrada nos últimos 7 dias.' : 'Nenhuma senha nesta situação.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cadastrando && <CadastrarModal lista={data} onFechar={() => setCadastrando(false)} onFeito={feito} />}
      {acao?.tipo === 'redirecionar' && <RedirecionarModal s={acao.s} lista={data} onFechar={() => setAcao(null)} onFeito={feito} />}
      {acao?.tipo === 'remover' && <RemoverModal s={acao.s} onFechar={() => setAcao(null)} onFeito={feito} />}
      {acao?.tipo === 'saiu' && (
        <ConfirmarModal titulo="Saiu do portal sem lançamento" confirmar="Pedir o lançamento" cancelar="Voltar" ocupado={saiu.isPending}
          onConfirmar={() => saiu.mutate(acao.s.id, { onSuccess: () => feito(`Lançamento pedido a ${acao.s.responsavel.nome}`), onError: (e) => feito((e as Error).message) })}
          onCancelar={() => setAcao(null)}>
          <div>
            <span className="sp-num">{acao.s.senha}</span> · {acao.s.hospital_nome}. A senha já saiu do portal da operadora: <strong>{acao.s.responsavel.nome}</strong> decidiu lá e
            {' '}falta lançar aqui. Ele recebe no App "Pedido de lançamento".
          </div>
        </ConfirmarModal>
      )}
      {aviso && <Toast message={aviso} onDone={() => setAviso('')} />}
    </div>
  )
}
