// Contatos por área, censo e avisos do App na ficha do hospital (23/11/2026, migration 0068).
// Próxima fase do App do auditor: a página do hospital no App mostra "Com quem falar" e como chega
// o censo, e o auditor avisa quando um contato mudou. Por ora só o administrador vê e grava
// (decisão do usuário, como o Módulo 2): HospitalView só monta isto para o admin.
//
// Nada se apaga (REGRAS do Bloco 2, seção 3): "Trocar a pessoa" grava a saída de quem estava
// (data e motivo) e cria quem entra na mesma área; "Tirar" grava só a saída. O aviso do App não
// muda contato nenhum: fica aqui até alguém marcar como tratado.
import { useState } from 'react'
import { Badge, Modal } from '../ui'
import { dataBR, dataHora } from '../../lib/datas'
import {
  useContatosHospital, useCorrigirContato, useIncluirContato, useSalvarCenso, useTirarContato,
  useTratarAviso, useTrocarContato,
} from '../../hooks/useHospitalContatos'
import type { AvisoContatoApp, ContatoHospital, DadosContato, FichaContatos } from '../../services/hospitalContatos.service'

const estilos = `
.hc-sub{font-size:var(--t-sm);color:var(--muted)}
.hc-nome{font-weight:600;color:var(--ink)}
.hc-acoes{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
.hc-aviso{padding:12px 16px;font-size:var(--t-sm);color:var(--ink-2)}
.hc-falta{margin:0 0 12px;padding:10px 12px;border-radius:var(--r-md);background:var(--warning-bg,#FCF0DD);color:var(--ink-2);font-size:var(--t-sm)}
.hc-campos{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hc-campos .hc-largo{grid-column:1/-1}
.hc-erro{font-size:var(--t-sm);color:var(--danger);margin:10px 0 0}
.hc-av{padding:12px 0;border-bottom:1px solid var(--border)}
.hc-av:last-child{border-bottom:0}
.hc-av p{margin:4px 0 0;color:var(--ink);font-size:var(--t-sm);white-space:pre-wrap}
.hc-vazio{padding:20px 8px;text-align:center;color:var(--muted);font-size:var(--t-sm)}
@media (max-width:720px){.hc-campos{grid-template-columns:1fr}}
`

const vazio = (s: string) => (s.trim() ? s.trim() : null)
const letras = (s: string) => (s.match(/\p{L}/gu) ?? []).length

function Campo({ id, rotulo, valor, onChange, largo, tipo, placeholder, disabled }: {
  id: string; rotulo: string; valor: string; onChange: (v: string) => void
  largo?: boolean; tipo?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <div className={largo ? 'hc-largo' : undefined}>
      <label className="form-lbl" htmlFor={id}>{rotulo}</label>
      <input id={id} className="bm-input" type={tipo || 'text'} value={valor} placeholder={placeholder}
        disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ── Incluir, corrigir e trocar a pessoa ────────────────────────────────────

type Modo = { tipo: 'incluir' } | { tipo: 'corrigir'; c: ContatoHospital } | { tipo: 'trocar'; c: ContatoHospital }

function ContatoModal({ hospitalKey, areas, modo, onFechar, onFeito }: {
  hospitalKey: string; areas: string[]; modo: Modo; onFechar: () => void; onFeito: (m: string) => void
}) {
  const base = modo.tipo === 'corrigir' ? modo.c : null
  const [area, setArea] = useState(modo.tipo === 'incluir' ? '' : modo.c.area)
  const [nome, setNome] = useState(base?.nome ?? '')
  const [cargo, setCargo] = useState(base?.cargo ?? '')
  const [telefone, setTelefone] = useState(base?.telefone ?? '')
  const [email, setEmail] = useState(base?.email ?? '')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const incluir = useIncluirContato(hospitalKey)
  const corrigir = useCorrigirContato()
  const trocar = useTrocarContato()
  const ocupado = incluir.isPending || corrigir.isPending || trocar.isPending
  const pronto = !!area && letras(nome) >= 2 && (modo.tipo !== 'trocar' || letras(motivo) >= 3)

  function salvar() {
    if (!pronto || ocupado) return
    setErro('')
    const d: DadosContato = { area, nome: nome.trim(), cargo: vazio(cargo), telefone: vazio(telefone), email: vazio(email) }
    const falhou = (e: unknown) => setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.')
    if (modo.tipo === 'incluir') incluir.mutate(d, { onSuccess: () => onFeito(`Contato incluído: ${d.nome} (${area})`), onError: falhou })
    else if (modo.tipo === 'corrigir') corrigir.mutate({ id: modo.c.id, d }, { onSuccess: () => onFeito(`Contato corrigido: ${d.nome}`), onError: falhou })
    else trocar.mutate({ id: modo.c.id, d: { ...d, motivo: motivo.trim() } },
      { onSuccess: () => onFeito(`${modo.c.nome} saiu; ${d.nome} entrou em ${area}`), onError: falhou })
  }

  const titulo = modo.tipo === 'incluir' ? 'Incluir contato' : modo.tipo === 'corrigir' ? 'Corrigir contato' : `Trocar a pessoa · ${modo.c.area}`
  return (
    <Modal title={titulo} largura={560} onClose={ocupado ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={ocupado}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={salvar} disabled={!pronto || ocupado}>
            {ocupado ? 'Salvando…' : modo.tipo === 'trocar' ? 'Trocar' : 'Salvar'}
          </button>
        </>
      )}>
      {modo.tipo === 'trocar' && (
        <p className="hc-sub" style={{ margin: '0 0 12px' }}>
          <strong>{modo.c.nome}</strong> sai da ficha (fica no histórico, com o motivo) e quem você escrever entra na mesma área.
        </p>
      )}
      <div className="hc-campos">
        {modo.tipo !== 'trocar' && (
          <div className="hc-largo">
            <label className="form-lbl" htmlFor="hc-area">Área</label>
            <select id="hc-area" className="bm-input bm-select" value={area} disabled={ocupado} onChange={(e) => setArea(e.target.value)}>
              <option value="">Escolha</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}
        <Campo id="hc-nome" rotulo={modo.tipo === 'trocar' ? 'Quem entra' : 'Nome'} valor={nome} onChange={setNome} largo disabled={ocupado} />
        <Campo id="hc-cargo" rotulo="Cargo" valor={cargo} onChange={setCargo} disabled={ocupado} />
        <Campo id="hc-tel" rotulo="Telefone" valor={telefone} onChange={setTelefone} tipo="tel" placeholder="(11) 0000-0000" disabled={ocupado} />
        <Campo id="hc-email" rotulo="E-mail" valor={email} onChange={setEmail} tipo="email" largo disabled={ocupado} />
        {modo.tipo === 'trocar' && (
          <Campo id="hc-motivo" rotulo={`Por que ${modo.c.nome} saiu`} valor={motivo} onChange={setMotivo} largo
            placeholder="Por exemplo: saiu do hospital, mudou de área" disabled={ocupado} />
        )}
      </div>
      {erro && <p className="hc-erro">{erro}</p>}
    </Modal>
  )
}

function TirarModal({ c, onFechar, onFeito }: { c: ContatoHospital; onFechar: () => void; onFeito: (m: string) => void }) {
  const tirar = useTirarContato()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const pronto = letras(motivo) >= 3
  function enviar() {
    if (!pronto) return
    setErro('')
    tirar.mutate({ id: c.id, motivo: motivo.trim() }, {
      onSuccess: () => onFeito(`${c.nome} saiu da ficha`),
      onError: (e) => setErro((e as Error).message || 'Não foi possível tirar. Tente de novo.'),
    })
  }
  return (
    <Modal title="Tirar da ficha" onClose={tirar.isPending ? () => {} : onFechar}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onFechar} disabled={tirar.isPending}>Voltar</button>
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!pronto || tirar.isPending}>
            {tirar.isPending ? 'Tirando…' : 'Tirar'}
          </button>
        </>
      )}>
      <p className="hc-sub" style={{ margin: '0 0 12px' }}>
        <strong>{c.nome}</strong> ({c.area}) sai da ficha sem ninguém no lugar. Fica no histórico, com o motivo.
      </p>
      <Campo id="hc-tira" rotulo="Motivo" valor={motivo} onChange={setMotivo} largo disabled={tirar.isPending} />
      {erro && <p className="hc-erro">{erro}</p>}
    </Modal>
  )
}

// ── Censo ──────────────────────────────────────────────────────────────────

function Censo({ hospitalKey, f, onFeito }: { hospitalKey: string; f: FichaContatos; onFeito: (m: string) => void }) {
  const [via, setVia] = useState(f.censo.via ?? '')
  const [hora, setHora] = useState(f.censo.hora ?? '')
  const [bairro, setBairro] = useState(f.bairro ?? '')
  const [erro, setErro] = useState('')
  const salvar = useSalvarCenso(hospitalKey)
  const mudou = via !== (f.censo.via ?? '') || hora !== (f.censo.hora ?? '') || bairro !== (f.bairro ?? '')
  function enviar() {
    setErro('')
    salvar.mutate({ via: vazio(via), hora: vazio(hora), bairro: vazio(bairro) }, {
      onSuccess: () => onFeito('Censo e bairro salvos'),
      onError: (e) => setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.'),
    })
  }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Censo e bairro</div>
          <div className="hc-sub">O auditor vê na página do hospital, no App.</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={enviar} disabled={!mudou || salvar.isPending || !f.disponivel}>
          {salvar.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      <div className="card-body">
        <div className="hc-campos" style={{ gridTemplateColumns: '2fr 1fr 2fr' }}>
          <Campo id="hc-via" rotulo="Por onde chega o censo" valor={via} onChange={setVia} placeholder="E-mail da recepção, portal, WhatsApp" disabled={!f.disponivel} />
          <Campo id="hc-hora" rotulo="Até que horas" valor={hora} onChange={setHora} placeholder="09:00" disabled={!f.disponivel} />
          <Campo id="hc-bairro" rotulo="Bairro" valor={bairro} onChange={setBairro} disabled={!f.disponivel} />
        </div>
        {erro && <p className="hc-erro">{erro}</p>}
      </div>
    </div>
  )
}

// ── Avisos do App ──────────────────────────────────────────────────────────

function Avisos({ avisos, onFeito }: { avisos: AvisoContatoApp[]; onFeito: (m: string) => void }) {
  const tratar = useTratarAviso()
  const pend = avisos.filter((a) => !a.tratado).length
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Avisos do App{pend ? ` · ${pend} pendente${pend > 1 ? 's' : ''}` : ''}</div>
          <div className="hc-sub">O auditor avisa pelo App quando um contato mudou. O aviso não muda a ficha: confira e atualize acima.</div>
        </div>
      </div>
      <div className="card-body">
        {avisos.length ? avisos.map((a) => (
          <div key={a.id} className="hc-av" style={a.tratado ? { opacity: 0.6 } : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="hc-nome">{a.profissional_nome}</span>
              <span className="hc-sub">{dataHora(a.em)}</span>
              <span style={{ flex: 1 }} />
              {a.tratado
                ? <Badge variant="success">Tratado por {a.tratado.por_nome}{a.tratado.em ? `, ${dataHora(a.tratado.em)}` : ''}</Badge>
                : (
                  <button type="button" className="btn btn-outline btn-sm" disabled={tratar.isPending}
                    onClick={() => tratar.mutate(a.id, { onSuccess: () => onFeito('Aviso marcado como tratado'), onError: (e) => onFeito((e as Error).message) })}>
                    Marcar como tratado
                  </button>
                )}
            </div>
            <p>{a.texto}</p>
          </div>
        )) : <div className="hc-vazio">Nenhum aviso do App para este hospital.</div>}
      </div>
    </div>
  )
}

// ── A seção inteira ────────────────────────────────────────────────────────

export default function ContatosHospital({ hospitalKey, onToast }: { hospitalKey: string; onToast: (m: string) => void }) {
  const { data: f, isLoading, isError, error } = useContatosHospital(hospitalKey)
  const [modo, setModo] = useState<Modo | null>(null)
  const [tira, setTira] = useState<ContatoHospital | null>(null)
  const [verSaidas, setVerSaidas] = useState(false)
  const feito = (m: string) => { setModo(null); setTira(null); onToast(m) }

  if (isLoading) return <div className="card" style={{ marginBottom: 16 }}><div className="hc-vazio">Carregando os contatos…</div></div>
  if (isError || !f) {
    return <div className="card" style={{ marginBottom: 16 }}><div className="hc-aviso">{(error as Error)?.message || 'Não foi possível carregar os contatos.'}</div></div>
  }
  return (
    <>
      <style>{estilos}</style>
      {!f.disponivel && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="hc-aviso">Os contatos por área ainda não estão disponíveis neste ambiente: falta a migration 0068 no banco.</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Contatos por área</div>
            <div className="hc-sub">O auditor vê no App as áreas que usa: contas médicas, auditoria interna, censo, guias e autorizações, prorrogações, cronograma de fechamento e faturamento.</div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled={!f.disponivel} onClick={() => setModo({ tipo: 'incluir' })}>Incluir contato</button>
        </div>
        <div className="card-body">
          {f.disponivel && f.faltam_essenciais.length > 0 && (
            <p className="hc-falta">Faltam contatos essenciais: <strong>{f.faltam_essenciais.join(', ')}</strong>.</p>
          )}
          {f.contatos.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="bmais-table">
                <thead><tr><th>Área</th><th>Pessoa</th><th>Telefone</th><th>E-mail</th><th>Desde</th><th /></tr></thead>
                <tbody>
                  {f.contatos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.area}{f.essenciais.includes(c.area) && <span className="hc-sub"> · essencial</span>}</td>
                      <td><div className="hc-nome">{c.nome}</div>{c.cargo && <div className="hc-sub">{c.cargo}</div>}</td>
                      <td className="mono">{c.telefone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{dataBR(c.desde)}</td>
                      <td>
                        <div className="hc-acoes">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModo({ tipo: 'corrigir', c })}>Corrigir</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setModo({ tipo: 'trocar', c })}>Trocar a pessoa</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTira(c)}>Tirar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="hc-vazio">Nenhum contato cadastrado. No App, o auditor vê "Nenhum contato cadastrado".</div>}

          {f.saidas.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVerSaidas((v) => !v)}>
                {verSaidas ? 'Esconder' : 'Ver'} quem saiu · {f.saidas.length}
              </button>
              {verSaidas && (
                <div style={{ overflowX: 'auto', marginTop: 8 }}>
                  <table className="bmais-table">
                    <thead><tr><th>Área</th><th>Pessoa</th><th>Período</th><th>Motivo</th></tr></thead>
                    <tbody>
                      {f.saidas.map((c) => (
                        <tr key={c.id}>
                          <td>{c.area}</td>
                          <td>{c.nome}{c.telefone && <div className="hc-sub">{c.telefone}</div>}</td>
                          <td>{dataBR(c.desde)} a {dataBR(c.ate)}</td>
                          <td>{c.motivo_saida || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Censo key={`${f.censo.via}|${f.censo.hora}|${f.bairro}`} hospitalKey={hospitalKey} f={f} onFeito={feito} />
      <Avisos avisos={f.avisos} onFeito={feito} />

      {modo && <ContatoModal hospitalKey={hospitalKey} areas={f.areas} modo={modo} onFechar={() => setModo(null)} onFeito={feito} />}
      {tira && <TirarModal c={tira} onFechar={() => setTira(null)} onFeito={feito} />}
    </>
  )
}
