import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  Profissional, ProfTipo, Escala, ProfissionalDetalhe,
} from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { KpiCard, Badge, Modal, LoadingState } from '../components/ui'
import Toast from '../components/Toast'
import UsuariosAcesso from '../components/UsuariosAcesso'
import { useEquipe, useProfissional, useHospitais } from '../hooks/useEquipe'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import {
  criarProfissional, atualizarProfissional, definirAtivoProfissional,
} from '../services/equipe.service'
import { adicionarEscala, removerEscala } from '../services/escala.service'

const TIPO_LABEL: Record<ProfTipo, string> = {
  E: 'Enfermeiro(a)', M: 'Médico(a) Auditor(a)', O: 'Operador(a) Interno(a)',
}
const SERVICO_LABEL: Record<string, string> = {
  P: 'Análise de Conta', V: 'Aud. Concorrente', AMB: 'Ambulatório', PS: 'Pronto Socorro',
}
const SERVICOS = [
  { key: 'P', label: 'P — Análise de Conta' },
  { key: 'V', label: 'V — Auditoria Concorrente' },
  { key: 'AMB', label: 'AMB — Ambulatório' },
  { key: 'PS', label: 'PS — Pronto Socorro' },
]

// ── Ícones (portados do equipe.html) ─────────────────────────────────────────
const IconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)
const IconCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
)
const IconX = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
)
const IconEyeOff = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
)
const IconUsers = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)

const localStyles = `
.prof-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:border-color .12s,background .12s;margin-bottom:6px}
.prof-item:hover{border-color:var(--primary-3);background:var(--primary-soft)}
.prof-item.active{border-color:var(--primary);background:var(--primary-soft)}
.prof-item.inativo{opacity:.55}
.prof-item.inativo:hover{opacity:.75}
.prof-avatar{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0;font-family:var(--font-mono)}
.prof-avatar.E{background:linear-gradient(135deg,#0E7A53,#065A3D)}
.prof-avatar.M{background:linear-gradient(135deg,#1F6FBE,#0F4D9E)}
.prof-avatar.O{background:linear-gradient(135deg,#D9690C,#A84F09)}
.detail-panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:24px;position:sticky;top:80px;max-height:calc(100vh - 110px);overflow-y:auto}
.escala-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:6px}
.servico-badge{font-family:var(--font-mono);font-size:10px;padding:2px 7px;border-radius:4px;font-weight:700;background:var(--info-bg);color:var(--info);border:1px solid rgba(30,120,200,.2)}
.tab-section{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.tab-sec-btn{padding:5px 14px;border-radius:99px;border:1px solid var(--border);background:var(--surface);font-size:var(--t-sm);font-weight:500;color:var(--ink-2);cursor:pointer;transition:background .12s,border-color .12s}
.tab-sec-btn.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.edit-field label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:4px}
.inativos-toggle{font-size:var(--t-sm);color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:var(--r-sm);background:var(--surface-3);border:1px solid var(--border);margin-bottom:10px;user-select:none}
.inativos-toggle:hover{border-color:var(--border-strong)}
.escala-remove{background:none;border:none;cursor:pointer;color:var(--muted-2);padding:2px 4px;border-radius:4px;line-height:1;flex-shrink:0;display:grid;place-items:center;transition:color .12s}
.escala-remove:hover{color:var(--danger)}
`

function isAtivo(p: Profissional): boolean {
  return Boolean(p.ativo)
}

export default function Equipe() {
  const qc = useQueryClient()
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | ProfTipo>('todos')
  const [showInativos, setShowInativos] = useState(false)
  const [selId, setSelId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { data, isLoading } = useEquipe()
  const { data: detalhe } = useProfissional(selId)

  const todos = useMemo<Profissional[]>(() => {
    if (!data) return []
    return [...data.enfermeiros, ...data.medicos, ...data.operadores]
  }, [data])

  const totalInativos = todos.filter((p) => !isAtivo(p)).length

  function visiveisPorTipo(lista: Profissional[]): Profissional[] {
    return lista.filter((p) => {
      if (tipoFiltro !== 'todos' && p.tipo !== tipoFiltro) return false
      if (!isAtivo(p) && !showInativos) return false
      return true
    })
  }

  function invalidar() {
    invalidarPorEvento(qc, 'equipeAlterada')
    // Detalhe do profissional selecionado é granular por id — invalida à parte.
    if (selId != null) qc.invalidateQueries({ queryKey: queryKeys.profissional(selId) })
  }

  const enfermeirosMedicos = data ? visiveisPorTipo([...data.enfermeiros, ...data.medicos]) : []
  const operadoresVis = data ? visiveisPorTipo(data.operadores) : []
  const mostrarOperadores = tipoFiltro === 'todos' || tipoFiltro === 'O'

  const subtitle = data
    ? `${data.total_prof} ativos${data.total_todos > data.total_prof ? ` · ${data.total_todos - data.total_prof} inativos` : ''} · clique em um nome para editar`
    : undefined

  usePageHeader({ title: 'Equipe B+ Auditoria', subtitle })

  return (
    <>
      <style>{localStyles}</style>

      {isLoading && <LoadingState label="Carregando equipe…" />}

      {data && (
        <>
          {/* KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
            <KpiCard variant="success" label="Enfermeiros" value={data.enfermeiros.filter(isAtivo).length}
              meta={`${data.enfermeiros.filter((p) => !isAtivo(p)).length > 0 ? `${data.enfermeiros.filter((p) => !isAtivo(p)).length} inativos · ` : ''}ativos no sistema`} />
            <KpiCard variant="info" label="Médicos Auditores" value={data.medicos.filter(isAtivo).length}
              meta={`${data.medicos.filter((p) => !isAtivo(p)).length > 0 ? `${data.medicos.filter((p) => !isAtivo(p)).length} inativos · ` : ''}ativos no sistema`} />
            <KpiCard variant="warning" label="Operadores Internos" value={data.operadores.filter(isAtivo).length} meta="equipe B+" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, alignItems: 'start' }}>
            {/* Lista */}
            <div>
              {/* Filtro por tipo */}
              <div className="tab-section">
                {([['todos', `Todos (${data.total_todos})`], ['E', `Enfermeiros (${data.enfermeiros.length})`], ['M', `Médicos Auditores (${data.medicos.length})`], ['O', `Operadores (${data.operadores.length})`]] as const).map(([t, lbl]) => (
                  <button key={t} className={`tab-sec-btn${tipoFiltro === t ? ' active' : ''}`} onClick={() => setTipoFiltro(t)}>{lbl}</button>
                ))}
              </div>

              {/* Toggle mostrar/ocultar inativos */}
              {totalInativos > 0 && (
                <div className="inativos-toggle" onClick={() => setShowInativos((v) => !v)}>
                  {IconEyeOff}
                  <span>{showInativos ? 'Ocultar desativados' : `Mostrar ${totalInativos} desativado${totalInativos > 1 ? 's' : ''}`}</span>
                </div>
              )}

              {/* Profissionais de Saúde */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Profissionais de Saúde</div>
                <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
                  {IconPlus}
                  Adicionar
                </button>
              </div>
              <div>
                {enfermeirosMedicos.map((p) => (
                  <ProfItem key={p.id} p={p} active={selId === p.id} onClick={() => setSelId(p.id)} />
                ))}
                {enfermeirosMedicos.length === 0 && (
                  <div className="empty-state" style={{ padding: '36px 16px' }}>
                    <div style={{ marginBottom: 8, opacity: 0.4, display: 'flex', justifyContent: 'center' }}><IconUsers /></div>
                    <div className="fw-6">Nenhum profissional cadastrado</div>
                    <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>Use o botão "+ Adicionar" para cadastrar.</div>
                  </div>
                )}
              </div>

              {/* Operadores Internos B+ */}
              {mostrarOperadores && (
                <>
                  <div className="section-label" style={{ marginTop: 20 }}>Operadores Internos B+</div>
                  <div>
                    {operadoresVis.map((p) => (
                      <ProfItem key={p.id} p={p} active={selId === p.id} onClick={() => setSelId(p.id)} />
                    ))}
                    {operadoresVis.length === 0 && (
                      <div className="empty-state" style={{ padding: '24px 16px' }}>
                        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Nenhum operador interno cadastrado.</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Painel de detalhe / edição */}
            <div>
              <div className="detail-panel">
                {selId == null && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ opacity: 0.3, marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconUsers size={48} /></div>
                    <div className="fw-6" style={{ color: 'var(--ink-2)', marginBottom: 4 }}>Selecione um profissional</div>
                    <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Clique em um nome na lista para ver e editar os detalhes.</div>
                  </div>
                )}
                {selId != null && detalhe && (
                  <DetalheProf
                    key={detalhe.profissional.id}
                    detalhe={detalhe}
                    opsLista={data.ops_lista}
                    onToast={setToast}
                    onChanged={invalidar}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Usuários de acesso (contas de login) — só admin vê */}
          <UsuariosAcesso onToast={setToast} />
        </>
      )}

      {addOpen && (
        <AddProfModal
          onClose={() => setAddOpen(false)}
          onDone={(msg) => { setAddOpen(false); setToast(msg); invalidar() }}
          onError={setToast}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

// ── Item da lista ────────────────────────────────────────────────────────────
function ProfItem({ p, active, onClick }: { p: Profissional; active: boolean; onClick: () => void }) {
  return (
    <div className={`prof-item${active ? ' active' : ''}${!isAtivo(p) ? ' inativo' : ''}`} onClick={onClick}>
      <div className={`prof-avatar ${p.tipo}`}>{p.nome.slice(0, 2).toUpperCase()}</div>
      <div className="flex-1 truncate">
        <div className="fw-6 truncate" style={{ fontSize: 'var(--t-base)' }}>{p.nome}</div>
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{TIPO_LABEL[p.tipo]}</div>
      </div>
      {isAtivo(p) ? <Badge variant="success" dot>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
    </div>
  )
}

// ── Painel de detalhe (edição + escala) ──────────────────────────────────────
function DetalheProf({ detalhe, opsLista, onToast, onChanged }: {
  detalhe: ProfissionalDetalhe
  opsLista: Array<{ key: string; nome: string }>
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const p = detalhe.profissional
  const ativo = isAtivo(p)
  const [nome, setNome] = useState(p.nome)
  const [tipo, setTipo] = useState<ProfTipo>(p.tipo)
  const [formEscala, setFormEscala] = useState(false)
  const [saving, setSaving] = useState(false)

  async function salvarEdicao() {
    const n = nome.trim()
    if (!n) { onToast('Nome não pode ser vazio'); return }
    setSaving(true)
    try {
      await atualizarProfissional(p.id, n, tipo)
      onToast('✓ Dados atualizados')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo() {
    const novo = !ativo
    if (!confirm(`${novo ? 'Reativar' : 'Desativar'} este profissional?`)) return
    try {
      await definirAtivoProfissional(p.id, novo)
      onToast(novo ? '✓ Profissional reativado' : 'Profissional desativado')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="row" style={{ gap: 14, marginBottom: 16 }}>
        <div className={`prof-avatar ${tipo}`} style={{ width: 44, height: 44, fontSize: 15, borderRadius: 12 }}>{nome.slice(0, 2).toUpperCase()}</div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="fw-7" style={{ fontSize: 'var(--t-lg)', color: 'var(--ink)', lineHeight: 1.2 }}>{p.nome}</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 2 }}>{TIPO_LABEL[p.tipo]}</div>
        </div>
        {ativo ? <Badge variant="success" dot>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
      </div>

      {/* Campos editáveis */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16, padding: 14, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div className="edit-field">
          <label>Nome completo</label>
          <input type="text" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="edit-field">
          <label>Cargo / Tipo</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
            <option value="O">Operador(a) Interno(a)</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={salvarEdicao} disabled={saving}>
            {IconCheck}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Escala de Hospitais */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Escala de Hospitais</div>
        <button className="btn btn-outline btn-sm" onClick={() => setFormEscala((v) => !v)}>
          {IconPlus}
          Adicionar
        </button>
      </div>

      {formEscala && (
        <FormEscala
          profId={p.id}
          opsLista={opsLista}
          onClose={() => setFormEscala(false)}
          onToast={onToast}
          onChanged={onChanged}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <EscalaList escala={detalhe.escala} onToast={onToast} onChanged={onChanged} />
      </div>

      {/* Ações */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${ativo ? 'btn-outline' : 'btn-primary'}`} onClick={toggleAtivo}>
          {ativo ? 'Desativar' : '✓ Reativar'}
        </button>
      </div>
    </div>
  )
}

// ── Lista de escala (agrupada por operadora) ─────────────────────────────────
function EscalaList({ escala, onToast, onChanged }: { escala: Escala[]; onToast: (m: string) => void; onChanged: () => void }) {
  if (escala.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: 'var(--t-sm)', padding: '10px 0' }}>Sem escala cadastrada neste sistema.</div>
  }

  async function remover(id: number) {
    if (!confirm('Remover este hospital da escala?')) return
    try {
      await removerEscala(id)
      onToast('Removido da escala')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    }
  }

  const grupos: Array<{ op: string; itens: Escala[] }> = []
  for (const e of escala) {
    const last = grupos[grupos.length - 1]
    if (last && last.op === e.operadora_key) last.itens.push(e)
    else grupos.push({ op: e.operadora_key, itens: [e] })
  }

  return (
    <>
      {grupos.map((g) => (
        <div key={g.op} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{g.op.toUpperCase()}</div>
          {g.itens.map((e) => (
            <div key={e.id} className="escala-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{e.hospital_nome}</div>
                <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{SERVICO_LABEL[e.servico] || e.servico}</div>
              </div>
              <span className="servico-badge">{e.servico}</span>
              <button className="escala-remove" onClick={() => remover(e.id)} title="Remover">{IconX}</button>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// ── Formulário: adicionar hospital à escala (selects encadeados) ─────────────
function FormEscala({ profId, opsLista, onClose, onToast, onChanged }: {
  profId: number
  opsLista: Array<{ key: string; nome: string }>
  onClose: () => void
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const [op, setOp] = useState('')
  const [hosp, setHosp] = useState('') // "key|nome"
  const [servico, setServico] = useState('P')
  const [saving, setSaving] = useState(false)

  const { data: hospitais, isFetching } = useHospitais(op)

  async function adicionar() {
    if (!op) { onToast('Selecione a operadora'); return }
    if (!hosp) { onToast('Selecione o hospital'); return }
    const [hospKey, hospNome] = hosp.split('|')
    setSaving(true)
    try {
      await adicionarEscala({
        hospital_key: hospKey, hospital_nome: hospNome, operadora_key: op,
        servico, profissional_id: profId,
      })
      onToast('✓ Hospital adicionado à escala')
      onChanged()
      onClose()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }

  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={labelStyle}>Operadora</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={op} onChange={(e) => { setOp(e.target.value); setHosp('') }}>
            <option value="">Selecione…</option>
            {opsLista.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Hospital</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={hosp} onChange={(e) => setHosp(e.target.value)} disabled={!op}>
            <option value="">{!op ? 'Selecione a operadora primeiro' : isFetching ? 'Carregando…' : 'Selecione…'}</option>
            {(hospitais ?? []).map((h) => <option key={h.key} value={`${h.key}|${h.nome}`}>{h.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Serviço</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={adicionar} disabled={saving}>Adicionar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: adicionar profissional ────────────────────────────────────────────
function AddProfModal({ onClose, onDone, onError }: {
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [tipo, setTipo] = useState<ProfTipo>('E')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  async function adicionar() {
    const n = nome.trim()
    if (!n) { onError('Informe o nome do profissional'); return }
    setSaving(true)
    try {
      await criarProfissional(n, tipo)
      onDone('✓ Profissional adicionado')
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Adicionar Profissional"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={adicionar} disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="uppercase t-muted" style={{ display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Tipo *</label>
          <select className="bm-input bm-select" value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
            <option value="O">Operador(a) Interno(a)</option>
          </select>
        </div>
        <div>
          <label className="uppercase t-muted" style={{ display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Nome completo *</label>
          <input type="text" className="bm-input" placeholder="Ex: Ana Clara Souza" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
      </div>
    </Modal>
  )
}
