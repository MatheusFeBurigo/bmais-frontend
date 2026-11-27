// Linha do tempo (24/11/2026): a tela `linha` do protótipo do Bloco 2 (redesenho
// de 12/11/2026) com os dados reais da trilha de Movimentações. Pedido do usuário:
// "temos uma tela de linha do tempo no protótipo, replique no sistema".
//
// Como no protótipo: primeiro o ritmo (registros por hora hoje, por dia em 7 e 14
// dias; a coluna filtra), depois as áreas como fichas, os filtros e a lista em
// trilho por dia, com o ícone da área em cada registro. Ao lado, quem mais
// registrou e onde; tudo filtra. O que o portal não tem fica de fora, em vez de
// inventado: o ícone "o médico ou enfermeiro do paciente vê no Portal" e o modo
// "só o registro" aberto de uma ficha.
//
// Tudo é contado no servidor (application/linha_do_tempo.py) sobre o período
// inteiro; aqui chega só a página da lista. Mesmo público de Movimentações
// (administrador e analista), em auth/permissions (EXCLUSIVAS.linhaDoTempo).
import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { podeVer, podeVerFichaPaciente, rotaFallback } from '../auth/permissions'
import { usePageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/ui'
import { useDebounce } from '../hooks/useCid'
import { useLinhaDoTempo } from '../hooks/useLinhaDoTempo'
import { ROLE_LABEL } from '../lib/usuarioRoles'
import type { LinhaArea, LinhaDoTempoPayload, LinhaItem, LinhaPeriodo, LinhaRanking, UserRole } from '../types/api'

const POR_PAGINA = 60

// Ícones do protótipo (ICONES), mesmo traço.
const ICONES: Record<string, ReactNode> = {
  lista: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  estetoscopio: <><path d="M6 3v6a5 5 0 0 0 10 0V3" /><path d="M11 14v2a4 4 0 0 0 8 0v-1" /><circle cx="19" cy="13" r="2" /></>,
  upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  quadro: <><rect x="3.5" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="11" rx="1.5" /><rect x="16.5" y="4" width="4" height="7" rx="1.5" /></>,
  chave: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3" /><path d="M17 6l3 3" /><path d="M14.5 8.5l2 2" /></>,
  doc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h6" /></>,
  cal: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  pessoas: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.8c1.7.7 3 2.5 3.5 5.2" /></>,
  predio: <><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M8 8h3M9.5 6.5v3" /><path d="M8 13h3M8 17h3" /><path d="M2 21h20" /></>,
  conversa: <path d="M4 5h16v11H9l-5 4z" />,
  escudo: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  troca: <><path d="M4 8h14l-3.5-3.5" /><path d="M20 16H6l3.5 3.5" /></>,
  pessoa: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.6h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  ok: <path d="M5 12.5l4.5 4.5L19 7" />,
  lapis: <><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M14.5 7.5l2 2" /></>,
  alerta: <><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></>,
  chevr: <path d="M9 6l6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  volta: <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>,
  busca: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
}

function Ic({ n, s = 16 }: { n: string; s?: number }) {
  return <svg className="lt-i" viewBox="0 0 24 24" width={s} height={s} aria-hidden="true">{ICONES[n]}</svg>
}

// Ícone de cada área (EV_AREA do protótipo, mais as do Módulo 1).
const ICONE_AREA: Record<LinhaArea, string> = {
  pacientes: 'estetoscopio', censos: 'upload', tarefas: 'quadro', senhas: 'chave', contas: 'doc',
  fech: 'cal', auditores: 'pessoas', cad: 'predio', obs: 'conversa', regras: 'escudo',
  dist: 'troca', usuarios: 'pessoa', geral: 'info',
}

const PERIODOS: Array<[LinhaPeriodo, string]> = [['hoje', 'Hoje'], ['7', '7 dias'], ['14', '14 dias']]
const DSEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const fN = (n: number) => n.toLocaleString('pt-BR')
const plural = (n: number, um: string, varios = `${um}s`) => `${fN(n)} ${n === 1 ? um : varios}`

/** Rótulo do dia na lista, como `fRel` + `fDA` do protótipo: "hoje", "ontem · 23/11/2026", "sex, 20/11 · 20/11/2026". */
function rotuloDia(dia: string, hoje: string): string {
  const [a, m, d] = dia.split('-')
  const ontem = new Date(`${hoje}T12:00:00Z`)
  ontem.setUTCDate(ontem.getUTCDate() - 1)
  if (dia === hoje) return 'hoje'
  const completo = `${d}/${m}/${a}`
  if (dia === ontem.toISOString().slice(0, 10)) return `ontem · ${completo}`
  return `${DSEM[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${d}/${m} · ${completo}`
}

function papelDe(p: LinhaItem['papel']): string {
  return p ? (ROLE_LABEL[p as UserRole] ?? p) : ''
}

/** Uma linha do trilho (`linhaEv` do protótipo). Com ficha de paciente, abre a ficha. */
function Linha({ e, areaRotulo, onAbrir }: {
  e: LinhaItem; areaRotulo: string
  /** Ausente para quem não abre a ficha do paciente (o analista): a linha não vira botão. */
  onAbrir?: (id: number) => void
}) {
  const desf = e.desfeito_em != null
  const abre = e.internacao_id != null && onAbrir != null
  const hosp = e.hospitais[0]
  const meta = [
    e.quem,
    papelDe(e.papel),
    hosp ? `${hosp.nome}${e.hospitais.length > 1 ? ` e mais ${e.hospitais.length - 1}` : ''}` : '',
    e.operadora?.nome ?? '',
  ].filter(Boolean).join(' · ')
  const conteudo = (
    <>
      <span className="ev-h mono">{e.hora}</span>
      <span className={`ev-n ${desf ? '' : e.tom}`} title={areaRotulo}><Ic n={ICONE_AREA[e.area]} s={14} /></span>
      <span className="ev-t"><b>{e.texto}</b><small>{meta}</small></span>
      <span className="ev-c">
        {desf && <span className="lt-chip"><Ic n="volta" s={12} />desfeito {e.desfeito_hora}</span>}
        {abre && <Ic n="chevr" s={14} />}
      </span>
    </>
  )
  const cls = `ev ${desf ? 'desf' : ''} ${e.tom}`
  return abre
    ? <button type="button" className={cls} onClick={() => onAbrir!(e.internacao_id!)} title="Abrir a ficha do paciente">{conteudo}</button>
    : <div className={cls}>{conteudo}</div>
}

/** Ranking com barra (`rk` do protótipo). Com `onEscolher`, cada linha filtra. */
function Ranking({ itens, sel, onEscolher }: {
  itens: LinhaRanking[]; sel?: string; onEscolher?: (key: string) => void
}) {
  if (!itens.length) return <p className="lt-nota">Sem registro.</p>
  const mx = Math.max(1, ...itens.map((x) => x.n))
  return (
    <div className="pp-top">
      {itens.map((x) => {
        const corpo = (
          <>
            <span className="pp-n" title={x.nome}>{x.nome}</span>
            <span className="pp-b"><i style={{ width: `${(x.n / mx * 100).toFixed(1)}%` }} /></span>
            <b className="mono">{fN(x.n)}</b>
          </>
        )
        return onEscolher
          ? <button key={x.key} type="button" className="pp-l" aria-pressed={sel === x.key}
              onClick={() => onEscolher(sel === x.key ? '' : x.key)}>{corpo}</button>
          : <div key={x.key} className="pp-l estatico">{corpo}</div>
      })}
    </div>
  )
}

function Card({ titulo, sub, children, className = '', flush }: {
  titulo?: string; sub?: string; children: ReactNode; className?: string; flush?: boolean
}) {
  return (
    <section className={`card lt-card ${className}`}>
      {titulo && (
        <div className="card-header">
          <div style={{ minWidth: 0 }}>
            <div className="card-title">{titulo}</div>
            {sub && <div className="card-sub">{sub}</div>}
          </div>
        </div>
      )}
      <div className={flush ? 'lt-flush' : 'card-body'}>{children}</div>
    </section>
  )
}

/** Ritmo: colunas por hora ou por dia (`colunasG` do protótipo, uma série). */
function Ritmo({ d, balde, onBalde }: {
  d: LinhaDoTempoPayload; balde: string; onBalde: (id: string) => void
}) {
  const cols = d.ritmo
  const mx = Math.max(1, ...cols.map((c) => c.n))
  const denso = cols.length > 16
  const pula = denso ? Math.ceil(cols.length / 12) : 1
  return (
    <div className={`cg cgg ${denso ? 'denso' : ''}`}>
      <div className="cg-plot" style={{ height: 84 }}>
        {cols.map((c, j) => (
          <button key={c.id} type="button"
            className={`cg-col ${balde === c.id ? 'sel' : ''} ${c.fraco ? 'fraco' : ''}`}
            title={`${c.tit}: registros ${fN(c.n)}`} aria-pressed={balde === c.id}
            onClick={() => onBalde(balde === c.id ? '' : c.id)}>
            {!denso && <b>{c.n ? fN(c.n) : ''}</b>}
            <div className="cg-stack" style={{ height: `${(c.n / mx * 100).toFixed(1)}%` }}>
              {c.n > 0 && <i style={{ flex: c.n }} />}
            </div>
            <small>{j % pula ? '' : c.rot}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LinhaDoTempo() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const liberado = podeVer(role, 'linhaDoTempo') && role != null
  const abreFicha = podeVerFichaPaciente(role)

  const [periodo, setPeriodo] = useState<LinhaPeriodo>('hoje')
  const [area, setArea] = useState('')
  const [operadora, setOperadora] = useState('')
  const [quem, setQuem] = useState('')
  const [busca, setBusca] = useState('')
  const [balde, setBalde] = useState('')
  const [limite, setLimite] = useState(POR_PAGINA)
  const q = useDebounce(busca.trim(), 350)

  const { data: d, isLoading, isError } = useLinhaDoTempo(
    { periodo, area, operadora, quem, q, balde, limite }, liberado)

  // Todo filtro novo volta à primeira página da lista, como no protótipo.
  const muda = <T,>(set: (v: T) => void) => (v: T) => { set(v); setLimite(POR_PAGINA) }

  const hojeTotal = d?.hoje_total
  usePageHeader(useMemo(() => ({
    title: 'Linha do tempo',
    subtitle: hojeTotal != null
      ? `${plural(hojeTotal, 'registro hoje', 'registros hoje')} · o que foi feito, por quem e quando`
      : 'O que foi feito, por quem e quando',
  }), [hojeTotal]))

  const rotuloArea = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of d?.areas ?? []) m[a.key] = a.rotulo
    return m
  }, [d?.areas])

  // Os itens da página por dia, na ordem em que vieram (mais recentes primeiro).
  const dias = useMemo(() => {
    const out: Array<[string, LinhaItem[]]> = []
    for (const e of d?.itens ?? []) {
      const ult = out[out.length - 1]
      if (ult && ult[0] === e.dia) ult[1].push(e)
      else out.push([e.dia, [e]])
    }
    return out
  }, [d?.itens])

  if (!liberado) return <Navigate to={rotaFallback(role)} replace />

  if (isError && !d) {
    return (
      <div>
        <style>{estilos}</style>
        <div className="card"><div className="lt-vazio">
          {/* Sem a mensagem do servidor: nada técnico na tela (regra do usuário, 24/11/2026). */}
          <b>Não foi possível carregar a linha do tempo</b>Tente de novo em instantes.
        </div></div>
      </div>
    )
  }
  if (isLoading || !d) return <div><style>{estilos}</style><LoadingState /></div>

  const restantes = d.total - d.itens.length
  const lista = d.itens.length ? (
    <>
      {dias.map(([dia, es]) => (
        <div key={dia} className="ev-dia">
          <div className="lt-sec-t">{rotuloDia(dia, d.hoje)} · {plural(d.por_dia[dia] ?? es.length, 'registro')}</div>
          <div className="ev-tr">
            {es.map((e) => (
              <Linha key={e.id} e={e} areaRotulo={rotuloArea[e.area] ?? ''}
                onAbrir={abreFicha ? (id) => navigate(`/paciente/${id}`) : undefined} />
            ))}
          </div>
        </div>
      ))}
      {d.mais && (
        <div className="lt-mais">
          <button type="button" className="btn btn-ghost btn-sm lt-ghost" onClick={() => setLimite((l) => l + POR_PAGINA)}>
            Mostrar mais {fN(Math.min(POR_PAGINA, restantes))} de {fN(restantes)}
          </button>
        </div>
      )}
    </>
  ) : (
    <div className="lt-vazio">
      <Ic n="relogio" s={28} />
      <b>Nada registrado neste filtro</b>Mude o período ou tire um filtro.
    </div>
  )

  return (
    <div>
      <style>{estilos}</style>

      <Card titulo="Ritmo" className="lt-ritmo"
        sub={`${periodo === 'hoje' ? 'Registros por hora, hoje.' : 'Registros por dia, com fim de semana mais claro.'} Clique numa coluna para ver só aquele trecho.`}>
        <Ritmo d={d} balde={balde} onBalde={muda(setBalde)} />
      </Card>

      <div className="lt-areas" role="group" aria-label="Área">
        {[{ key: '', rotulo: 'Tudo', n: d.tudo, icone: 'lista' },
          ...d.areas.map((a) => ({ ...a, icone: ICONE_AREA[a.key] }))].map((a) => (
          <button key={a.key || 'tudo'} type="button"
            className={`lt-ficha ${area === a.key ? 'on' : ''} ${a.n ? '' : 'vz'}`}
            aria-pressed={area === a.key} onClick={() => muda(setArea)(a.key)}>
            <Ic n={a.icone} s={14} /><span>{a.rotulo}</span><b>{fN(a.n)}</b>
          </button>
        ))}
      </div>

      <div className="lt-filtros">
        <div className="lt-seg" role="group" aria-label="Período">
          {PERIODOS.map(([k, r]) => (
            <button key={k} type="button" aria-pressed={periodo === k}
              onClick={() => { setPeriodo(k); setBalde(''); setLimite(POR_PAGINA) }}>{r}</button>
          ))}
        </div>
        <label className="lt-campo">Operadora
          <select value={operadora} onChange={(ev) => muda(setOperadora)(ev.target.value)}>
            <option value="">Todas</option>
            {d.operadoras.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
          </select>
        </label>
        <label className="lt-campo">Quem fez
          <select value={quem} onChange={(ev) => muda(setQuem)(ev.target.value)}>
            <option value="">Todos</option>
            {d.pessoas.map((p) => <option key={p.key} value={p.key}>{p.nome}</option>)}
          </select>
        </label>
        <label className="lt-campo">
          <Ic n="busca" s={14} />
          <input type="search" value={busca} autoComplete="off" placeholder="Paciente, hospital ou texto"
            aria-label="Paciente, hospital ou texto" onChange={(ev) => { setBusca(ev.target.value); setLimite(POR_PAGINA) }} />
        </label>
      </div>

      {d.balde && (
        <div className="lt-fichas-f">
          <span>Filtro:</span>
          <button type="button" onClick={() => muda(setBalde)('')}>{d.balde.tit}<Ic n="x" s={12} /></button>
        </div>
      )}

      <div className="lt-grid">
        <Card flush><div className="ev-l">{lista}</div></Card>
        <div className="lt-lado">
          <Card titulo="Quem mais registrou" sub="Clique para ver só a pessoa.">
            <Ranking itens={d.quem_mais} sel={quem} onEscolher={muda(setQuem)} />
          </Card>
          <Card titulo="Onde" sub="Hospitais com mais registros no filtro.">
            <Ranking itens={d.onde} />
          </Card>
          <Card titulo="Como ler">
            <div className="lt-leg">
              <span><i className="ev-n ok"><Ic n="ok" s={12} /></i>feito ou aprovado</span>
              <span><i className="ev-n warn"><Ic n="lapis" s={12} /></i>ajuste, troca ou pedido</span>
              <span><i className="ev-n crit"><Ic n="alerta" s={12} /></i>recusa</span>
              <span><span><s>riscado</s>: foi desfeito</span></span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// O CSS da tela `linha` do protótipo (cg, lt-areas, ev, ev-tr, ev-n, pp, lt-leg),
// com os tokens do portal no lugar dos do protótipo.
const estilos = `
.lt-i{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lt-card{border-radius:14px;overflow:visible}
.lt-flush{padding:6px 0 0}
.lt-nota{font-size:12.5px;color:var(--muted)}
.lt-ritmo{margin-bottom:12px}
.lt-ritmo .card-body{padding-bottom:30px}

.cg{display:flex;flex-direction:column;gap:10px}
.cg-plot{display:flex;align-items:flex-end;gap:10px;border-bottom:1px solid var(--border-strong);padding:0 4px}
.cg-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;min-width:0;outline:none;background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer}
.cg-col b{font-size:12px;font-weight:650;color:var(--ink-2)}
.cg-col small{font-size:11px;color:var(--muted);transform:translateY(18px);white-space:nowrap}
.cg-stack{width:min(46px,100%);display:flex;flex-direction:column;gap:2px;border-radius:6px 6px 0 0;overflow:hidden;min-height:2px}
.cg-stack i{display:block;min-height:2px;background:var(--accent)}
.cg-col:hover .cg-stack,.cg-col:focus-visible .cg-stack{filter:brightness(1.08);box-shadow:0 0 0 2px var(--surface),0 0 0 3px var(--accent)}
.cgg .cg-col.fraco .cg-stack{opacity:.48}
.cgg .cg-col.sel .cg-stack{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent)}
.cgg.denso .cg-plot{gap:3px}.cgg.denso .cg-stack{width:100%;border-radius:3px 3px 0 0}

.lt-areas{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 12px}
.lt-ficha{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font:inherit;font-size:12.5px;font-weight:600;color:var(--ink-2);cursor:pointer;transition:box-shadow .12s,transform .12s}
.lt-ficha:hover{box-shadow:var(--shadow-md);transform:translateY(-1px)}
.lt-ficha b{font-size:12.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:var(--bg-2)}
.lt-ficha.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent-soft) 45%,var(--surface));box-shadow:0 0 0 2px var(--accent)}
.lt-ficha.vz{opacity:.55}

.lt-filtros{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.lt-seg{display:inline-flex;padding:3px;gap:2px;background:var(--bg-2);border-radius:10px;flex-wrap:wrap}
.lt-seg button{height:30px;padding:0 12px;border-radius:7px;border:0;background:none;font:inherit;font-size:12.5px;font-weight:500;color:var(--muted);cursor:pointer;white-space:nowrap}
.lt-seg button:hover{color:var(--ink)}
.lt-seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-xs),0 0 0 1px var(--border)}
.lt-campo{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 10px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface);font-size:12.5px;color:var(--muted);max-width:100%}
.lt-campo select,.lt-campo input{border:0;background:none;outline:none;color:var(--ink);font:inherit;font-size:12.5px;min-width:0;max-width:220px;height:30px}
.lt-campo input{width:210px}
.lt-campo:focus-within{box-shadow:0 0 0 3px rgba(31,111,190,.30);border-color:var(--accent)}

.lt-fichas-f{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:2px 2px 12px;font-size:12.5px;color:var(--muted)}
.lt-fichas-f button{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:0;background:var(--accent-soft);color:var(--accent-2);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
.lt-fichas-f button:hover{box-shadow:inset 0 0 0 1.5px var(--accent)}

.lt-grid{display:grid;gap:16px;grid-template-columns:minmax(0,3fr) minmax(300px,1.15fr);align-items:start}
.lt-lado{display:grid;gap:16px;align-content:start}
@media (max-width:1300px){.lt-grid{grid-template-columns:1fr}}

.ev-l{display:flex;flex-direction:column}
.ev-dia{padding:12px 16px 4px}
.lt-sec-t{font-size:11px;letter-spacing:.11em;text-transform:uppercase;font-weight:650;color:var(--muted-2);display:flex;align-items:center;gap:10px;margin-bottom:4px}
.lt-sec-t::after{content:"";flex:1;height:1px;background:var(--border)}
.ev{display:flex;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;font-size:13px;color:inherit;background:none;border:0}
.ev-tr{position:relative}
.ev-tr::before{content:"";position:absolute;left:67px;top:14px;bottom:14px;width:2px;background:var(--border);border-radius:1px}
.ev-tr .ev{position:relative;padding:7px 6px;border-radius:10px}
.ev-tr button.ev{cursor:pointer}
.ev-tr button.ev:hover{background:var(--surface-3)}
.ev-h{font-size:12px;color:var(--muted);min-width:40px}
.ev.warn .ev-h{color:var(--warning)}.ev.ok .ev-h{color:var(--success)}.ev.crit .ev-h{color:var(--danger)}
.ev.desf .ev-h{color:var(--muted)}
.ev-n{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;flex:none;background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--border-strong);color:var(--ink-2);position:relative;z-index:1;font-style:normal}
.ev-n.ok{background:var(--success-bg);box-shadow:inset 0 0 0 1.5px var(--success);color:var(--success)}
.ev-n.warn{background:var(--warning-bg);box-shadow:inset 0 0 0 1.5px var(--warning);color:var(--warning)}
.ev-n.crit{background:var(--danger-bg);box-shadow:inset 0 0 0 1.5px var(--danger);color:var(--danger)}
.ev-t{flex:1;min-width:0}
.ev-t b{display:block;font-weight:550;line-height:1.35;color:var(--ink)}
.ev-t small{display:block;font-size:12px;color:var(--muted)}
.ev.desf .ev-t b{text-decoration:line-through;color:var(--muted)}
.ev-c{display:inline-flex;align-items:center;gap:8px;color:var(--muted-2)}
.lt-chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:99px;font-size:11.5px;font-weight:550;white-space:nowrap;border:1px solid var(--border-strong);color:var(--muted);line-height:1}
.lt-chip .lt-i{stroke-width:2.1}
.lt-mais{display:flex;justify-content:center;padding:12px}
.lt-ghost{color:var(--accent-2)}.lt-ghost:hover{background:var(--accent-soft);color:var(--accent-2)}

.lt-vazio{padding:36px 20px;text-align:center;color:var(--muted);font-size:13px}
.lt-vazio .lt-i{color:var(--success);margin-bottom:8px}
.lt-vazio b{display:block;color:var(--ink);font-size:14px;margin-bottom:2px}

.pp-top{display:grid;gap:6px}
.pp-l{display:grid;grid-template-columns:120px 1fr 44px;gap:10px;align-items:center;background:none;border:0;padding:4px 2px;border-radius:8px;font:inherit;color:inherit;cursor:pointer;text-align:left;width:100%}
.pp-l:hover{background:var(--surface-3)}
.pp-l.estatico{cursor:default}.pp-l.estatico:hover{background:none}
.pp-l[aria-pressed="true"]{background:var(--accent-soft)}
.pp-n{font-size:13px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pp-b{display:flex;gap:2px;height:14px}.pp-b i{display:block;border-radius:3px;background:var(--accent)}
.pp-l b{font-size:12.5px;text-align:right}
@media (max-width:760px){.pp-l{grid-template-columns:90px 1fr 36px}}

.lt-leg{display:grid;gap:8px;font-size:12.5px;color:var(--ink-2)}
.lt-leg>span{display:flex;align-items:center;gap:8px}
.lt-leg .ev-n{width:22px;height:22px}
`
