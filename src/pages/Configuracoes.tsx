import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type {
  ConfiguracoesPayload, OperadoraCard, OperadoraSelected, OperadoraRegras,
  HospitalSelected, Profissional,
} from '../types/api'
import Layout from '../components/Layout'
import { Badge, OpAvatar, Modal, LoadingState } from '../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import Toast from '../components/Toast'

const SERVICO_LABEL: Record<string, string> = {
  P: 'Análise de Conta', V: 'Auditoria Concorrente', AMB: 'Ambulatório', PS: 'Pronto Socorro',
}
const SERVICOS = ['P', 'V', 'AMB', 'PS']

// Seta do accordion (rotaciona via CSS quando o item está aberto).
function ChevronRight() {
  return (
    <svg className="op-acc-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

const localStyles = `
.cfg-num-wrap{display:flex;align-items:stretch;border:1px solid var(--border-strong);border-radius:8px;overflow:hidden;background:var(--surface)}
.cfg-num-field{border:none;outline:none;padding:7px 10px;font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--ink);width:72px;text-align:center;background:transparent}
.cfg-num-suffix{background:var(--surface-3);border-left:1px solid var(--border);padding:7px 10px;font-size:var(--t-sm);color:var(--muted);display:flex;align-items:center}
.config-group{background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 18px;display:flex;flex-direction:column;gap:14px;margin-bottom:12px}
.config-group-title{font-size:var(--t-md);font-weight:600;color:var(--ink);margin-bottom:2px}
.config-field label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-bottom:5px}
.config-hint{font-size:var(--t-xs);color:var(--muted-2);font-style:italic;margin-top:4px}
.resp-chip{display:inline-flex;align-items:center;gap:7px;padding:4px 10px 4px 6px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:var(--t-sm);font-weight:500}
.resp-avatar{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--primary));color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;flex-shrink:0}
.toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--success-bg);border:1px solid rgba(14,122,83,.15);border-radius:var(--r-md)}
.toggle{width:36px;height:20px;border-radius:99px;background:var(--muted-3);position:relative;cursor:pointer;transition:background .15s;flex-shrink:0;border:none}
.toggle.on{background:var(--success)}
.toggle-knob{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .15s}
.toggle.on .toggle-knob{transform:translateX(16px)}
.stat-mini{background:var(--surface-3);border:1px solid var(--border);border-radius:var(--r-md);padding:10px 14px;text-align:center}
.stat-mini-val{font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--ink);line-height:1}
.stat-mini-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--muted);margin-top:3px}

/* ── Accordion de operadoras (visão geral) ── */
.op-acc{display:flex;flex-direction:column;gap:8px}
.op-acc-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;transition:border-color .12s,box-shadow .12s}
.op-acc-item.open{border-color:var(--border-strong);box-shadow:var(--shadow-sm)}
.op-acc-item.alert{border-color:var(--danger)}
.op-acc-head{display:flex;align-items:center;gap:14px;padding:12px 16px;cursor:pointer;user-select:none;width:100%;background:transparent;border:none;text-align:left}
.op-acc-head:hover{background:var(--surface-3)}
.op-acc-chevron{flex-shrink:0;color:var(--muted-2);transition:transform .2s cubic-bezier(.2,.7,.2,1)}
.op-acc-item.open .op-acc-chevron{transform:rotate(90deg);color:var(--primary-3)}
.op-acc-name{font-weight:600;font-size:var(--t-md);color:var(--ink);line-height:1.2}
.op-acc-resp{font-size:var(--t-sm);color:var(--muted);margin-top:1px}
.op-acc-body{padding:0 16px 16px 46px;display:flex;flex-direction:column;gap:14px;animation:op-acc-in .22s cubic-bezier(.2,.7,.2,1)}
.op-acc-rules{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:var(--t-sm);color:var(--muted)}
.op-acc-actions{display:flex;gap:8px;flex-wrap:wrap}
@keyframes op-acc-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@media (max-width:640px){.op-acc-body{padding-left:16px}}
`

export default function Configuracoes() {
  const [params, setParams] = useSearchParams()
  const op = params.get('op') || ''
  const hospital = params.get('hospital') || ''
  const [toast, setToast] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['configuracoes', op, hospital],
    queryFn: () => apiFetch<ConfiguracoesPayload>(
      `/configuracoes${op ? `?op=${op}${hospital ? `&hospital=${hospital}` : ''}` : ''}`,
    ),
  })

  function go(next: Record<string, string>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    setParams(p)
  }

  function invalidar() {
    qc.invalidateQueries({ queryKey: ['configuracoes'] })
    qc.invalidateQueries({ queryKey: ['sidebar'] })
  }

  if (isLoading || !data) {
    return <Layout title="Operadoras"><LoadingState /></Layout>
  }

  // ── Vista: detalhe de hospital ──────────────────────────────────────────
  if (data.hospital_selected && data.op_selected) {
    return (
      <HospitalView
        opSel={data.op_selected}
        hosp={data.hospital_selected}
        profs={data.profs_ativos}
        onNav={go}
        onToast={setToast}
        onChanged={invalidar}
        toast={toast}
      />
    )
  }

  // ── Vista: configuração de operadora ────────────────────────────────────
  if (data.op_selected) {
    return (
      <OperadoraView
        opSel={data.op_selected}
        onNav={go}
        onToast={setToast}
        onChanged={invalidar}
        toast={toast}
      />
    )
  }

  // ── Vista: grid geral ───────────────────────────────────────────────────
  return <OverviewView operadoras={data.operadoras} onNav={go} onToast={setToast} onChanged={invalidar} toast={toast} />
}

// ═══════════════════════ VISTA 1 — GRID GERAL ═══════════════════════════════
function OverviewView({ operadoras, onNav, onToast, onChanged, toast }: {
  operadoras: OperadoraCard[]
  onNav: (n: Record<string, string>) => void
  onToast: (m: string) => void
  onChanged: () => void
  toast: string | null
}) {
  const [novaOpen, setNovaOpen] = useState(false)
  const [busy, setBusy] = useState<'demo' | 'limpar' | null>(null)
  // Operadoras expandidas no accordion (várias podem ficar abertas ao mesmo tempo).
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpandidas((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function popularDemo() {
    if (!confirm('Inserir dados de demonstração (pacientes, relatórios e altas)?')) return
    setBusy('demo')
    try {
      const d = await apiFetch<{ ok?: boolean; pacientes_inseridos?: number; altas_inseridas?: number }>('/seed-demo', { method: 'POST' })
      if (d.ok) { onToast(`✓ Demo: ${d.pacientes_inseridos || 0} pacientes e ${d.altas_inseridas || 0} altas`); onChanged() }
      else onToast('Erro ao popular demo')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setBusy(null) }
  }

  async function limparDados() {
    const r = prompt('Isso vai apagar TODAS as internações, relatórios e censos.\nOperadoras, hospitais e equipe serão mantidos.\n\nDigite LIMPAR para confirmar:')
    if (r === null) return
    if (r.trim().toUpperCase() !== 'LIMPAR') { onToast('Confirmação incorreta — nada foi apagado'); return }
    setBusy('limpar')
    try {
      const d = await apiFetch<{ ok?: boolean; removidos?: { internacoes?: number; relatorios?: number } }>('/limpar-dados', { method: 'POST' })
      if (d.ok) { onToast(`✓ Base limpa: ${d.removidos?.internacoes || 0} internações removidas`); onChanged() }
      else onToast('Erro ao limpar dados')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setBusy(null) }
  }

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={popularDemo} disabled={busy != null}>{busy === 'demo' ? 'Inserindo…' : 'Dados demo'}</button>
      <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(200,36,60,.35)' }} onClick={limparDados} disabled={busy != null}>{busy === 'limpar' ? 'Limpando…' : 'Limpar dados'}</button>
      <button className="btn btn-primary btn-sm" onClick={() => setNovaOpen(true)}>Nova Operadora</button>
    </>
  )

  return (
    <Layout title="Operadoras de Saúde" subtitle="Configure as regras de monitoramento de cada operadora" actions={actions}>
      <style>{localStyles}</style>

      <div className="op-acc">
        {operadoras.map((o) => {
          const ativa = o.regras?.ativo !== false
          const open = expandidas.has(o.key)
          return (
            <div key={o.key} className={`op-acc-item${open ? ' open' : ''}`}>
              <button
                type="button"
                className="op-acc-head"
                onClick={() => toggle(o.key)}
                aria-expanded={open}
              >
                <ChevronRight />
                <OpAvatar opKey={o.key} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="op-acc-name truncate">{o.nome}</div>
                  <div className="op-acc-resp truncate">{o.responsaveis || 'Sem responsável definido'}</div>
                </div>
                <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginRight: 4 }}>
                  {o.hospitais_count || 0} hosp.
                </span>
                {ativa
                  ? <Badge variant="success" dot>Ativa</Badge>
                  : <Badge variant="muted">Inativa</Badge>}
              </button>

              {open && (
                <div className="op-acc-body">
                  <div className="op-acc-rules" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <span>Gatilho UTI: <strong className="mono t-ink-2">{o.regras?.dias_uti ?? '—'}d</strong></span>
                    <span>Apartamento: <strong className="mono t-ink-2">{o.regras?.dias_apartamento ?? '—'}d</strong></span>
                    <span>Enfermaria: <strong className="mono t-ink-2">{o.regras?.dias_enfermaria ?? '—'}d</strong></span>
                    <span>Janela relatório: <strong className="mono t-ink-2">{o.regras?.dias_entre_relatorios ?? '—'}d</strong></span>
                    <span>Longa: <strong className="mono t-ink-2">{o.regras?.dias_longa_permanencia ?? '—'}d</strong> / <strong className="mono t-ink-2">{o.regras?.dias_longa_avancada ?? '—'}d</strong></span>
                  </div>

                  <div className="op-acc-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => onNav({ op: o.key })}>Configurar regras</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {novaOpen && <NovaOperadoraModal onClose={() => setNovaOpen(false)} onDone={(key) => { setNovaOpen(false); onToast('✓ Operadora criada'); onNav({ op: key }) }} onError={onToast} />}
      {toast && <Toast message={toast} onDone={() => onToast('')} />}
    </Layout>
  )
}

// ═══════════════════════ VISTA 2 — CONFIG OPERADORA ═════════════════════════
function OperadoraView({ opSel, onNav, onToast, onChanged, toast }: {
  opSel: OperadoraSelected
  onNav: (n: Record<string, string>) => void
  onToast: (m: string) => void
  onChanged: () => void
  toast: string | null
}) {
  const [regras, setRegras] = useState<OperadoraRegras>(opSel.regras)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addHosp, setAddHosp] = useState(false)

  // Aviso de alterações não salvas (equivale ao beforeunload do template).
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function upd<K extends keyof OperadoraRegras>(k: K, v: OperadoraRegras[K]) {
    setRegras((r) => ({ ...r, [k]: v }))
    setDirty(true)
  }

  async function salvar() {
    setSaving(true)
    try {
      const d = await apiFetch<{ ok?: boolean; salvo?: boolean }>(`/configuracoes/operadora/${opSel.key}`, {
        method: 'POST',
        body: { key: opSel.key, nome: opSel.nome, ...regras },
      })
      if (d.ok || d.salvo) { onToast('✓ Configuração salva'); setDirty(false); onChanged() }
      else onToast('Erro ao salvar')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  const s = opSel.stats
  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => (window.location.href = `/?operadora=${opSel.key}`)}>Abrir dashboard</button>
      <button className="btn btn-primary btn-sm" onClick={salvar} disabled={!dirty || saving} style={{ opacity: dirty ? 1 : 0.5 }}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </>
  )

  const title = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 'var(--t-md)', color: 'var(--muted)', fontWeight: 400, cursor: 'pointer' }} onClick={() => onNav({})}>Operadoras /</span>
      <OpAvatar opKey={opSel.key} size={28} />
      {opSel.nome}
    </span>
  )

  return (
    <Layout title={title} subtitle={`${s.total_internados || 0} internados · SLA ${s.sla || 0}% · ${opSel.responsaveis || '—'}`} actions={actions}>
      <style>{localStyles}</style>

      {/* Stat mini row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <StatMini label="Internados" value={s.total_internados || 0} color="var(--ink)" />
        <StatMini label="Alertas" value={(s.sem_relatorio || 0) + (s.relatorio_vencido || 0)} color="var(--danger)" />
        <StatMini label="Em Dia" value={s.relatorio_em_dia || 0} color="var(--success)" />
        <StatMini label="SLA" value={`${s.sla || 0}%`} color={(s.sla || 0) >= 50 ? 'var(--success)' : 'var(--danger)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        {/* Form de regras */}
        <div className="card">
          <div className="card-header"><div className="card-title">Regras de Monitoramento</div></div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            <div className="config-group">
              <div className="config-group-title">Gatilho de Monitoramento</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <NumField label="UTI / CTI / UCO" value={regras.dias_uti} onChange={(v) => upd('dias_uti', v)} hint="dias para entrar no monitoramento" />
                <NumField label="Apartamento" value={regras.dias_apartamento} onChange={(v) => upd('dias_apartamento', v)} />
                <NumField label="Enfermaria" value={regras.dias_enfermaria} onChange={(v) => upd('dias_enfermaria', v)} />
                <div className="config-field">
                  <label>Leito não identificado</label>
                  <select className="bm-input bm-select" value={regras.fallback_sem_leito} onChange={(e) => upd('fallback_sem_leito', e.target.value)}>
                    {['ENFERMARIA', 'APARTAMENTO', 'UTI'].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="config-group">
              <div className="config-group-title">Controle de Relatórios de Auditoria</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                <NumField label="Janela entre relatórios" value={regras.dias_entre_relatorios} onChange={(v) => upd('dias_entre_relatorios', v)} hint="prazo máximo entre visitas de auditoria" />
                <NumField label="Alerta antecipado" value={regras.alerta_antecipado_dias} onChange={(v) => upd('alerta_antecipado_dias', v)} hint="avisar X dias antes do vencimento" />
              </div>
            </div>

            <div className="config-group">
              <div className="config-group-title">Permanência Prolongada (handoff)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                <NumField label="Longa Permanência (Pl.10)" value={regras.dias_longa_permanencia} onChange={(v) => upd('dias_longa_permanencia', v)} />
                <NumField label="Longa Avançada (Pl.30)" value={regras.dias_longa_avancada} onChange={(v) => upd('dias_longa_avancada', v)} />
              </div>
              <div className="toggle-wrap">
                <div>
                  <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>Monitorar longa permanência</div>
                  <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Exibir alertas de Pl.10 / Pl.30 desta operadora</div>
                </div>
                <button type="button" className={`toggle${regras.usar_longa_permanencia ? ' on' : ''}`} onClick={() => upd('usar_longa_permanencia', !regras.usar_longa_permanencia)} title="Ativar/desativar monitoramento de longa permanência">
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="config-group">
              <div className="config-group-title">Equipe e Status</div>
              <div>
                <div className="uppercase t-muted" style={{ marginBottom: 8, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Responsáveis</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {(regras.responsaveis || '').split(',').map((r) => r.trim()).filter(Boolean).map((r) => (
                    <div key={r} className="resp-chip">
                      <div className="resp-avatar">{r.slice(0, 2).toUpperCase()}</div>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                <div className="config-field">
                  <label>Editar responsáveis (separados por vírgula)</label>
                  <input type="text" className="bm-input" value={regras.responsaveis || ''} placeholder="Ex: Ana Silva, João Costa" onChange={(e) => upd('responsaveis', e.target.value)} />
                </div>
              </div>

              <div className="toggle-wrap">
                <div>
                  <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>Operadora ativa</div>
                  <div style={{ fontSize: 'var(--t-sm)', color: 'var(--success-2)' }}>Inclusa no monitoramento e relatórios</div>
                </div>
                <button type="button" className={`toggle${regras.ativo ? ' on' : ''}`} onClick={() => upd('ativo', !regras.ativo)} title="Ativar/desativar operadora">
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hospitais */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hospitais — {opSel.nome}</div>
            <button className="btn btn-outline btn-sm" onClick={() => setAddHosp((v) => !v)}>Adicionar</button>
          </div>
          <div className="card-body">
            {addHosp && <AddHospitalForm opKey={opSel.key} onClose={() => setAddHosp(false)} onToast={onToast} onChanged={onChanged} />}

            {opSel.hospitais.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {opSel.hospitais.map((h) => {
                  const alert = (h.urgente || 0) > 0
                  return (
                    <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-3)', border: `1px solid ${alert ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer' }} onClick={() => onNav({ op: opSel.key, hospital: h.key })}>
                      <div className="flex-1 truncate">
                        <div className="fw-6 truncate" style={{ fontSize: 'var(--t-base)' }}>{h.nome}</div>
                        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
                          {h.internados || 0} internados
                          {alert && <> · <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{h.urgente} alertas</span></>}
                        </div>
                      </div>
                      <span style={{ color: 'var(--muted-2)' }}>›</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '36px 16px' }}>
                <div className="fw-6" style={{ marginBottom: 4 }}>Nenhum hospital cadastrado</div>
                <div style={{ fontSize: 'var(--t-sm)' }}>Adicione os hospitais desta operadora acima.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => onToast('')} />}
    </Layout>
  )
}

// ═══════════════════════ VISTA 3 — DETALHE HOSPITAL ═════════════════════════
function HospitalView({ opSel, hosp, profs, onNav, onToast, onChanged, toast }: {
  opSel: OperadoraSelected
  hosp: HospitalSelected
  profs: Profissional[]
  onNav: (n: Record<string, string>) => void
  onToast: (m: string) => void
  onChanged: () => void
  toast: string | null
}) {
  const [addForm, setAddForm] = useState(false)
  const enfermeiros = hosp.escala.filter((e) => e.profissional_tipo === 'E').length
  const medicos = hosp.escala.filter((e) => e.profissional_tipo === 'M').length
  const servicos = new Set(hosp.escala.map((e) => e.servico)).size

  const title = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 'var(--t-md)', color: 'var(--muted)', fontWeight: 400 }}>
        <span style={{ cursor: 'pointer' }} onClick={() => onNav({})}>Operadoras</span>
        {' / '}
        <span style={{ cursor: 'pointer' }} onClick={() => onNav({ op: opSel.key })}>{opSel.nome}</span>
        {' / '}
      </span>
      {hosp.nome}
    </span>
  )

  // Agrupa a escala por serviço para renderização
  const grupos: Array<{ servico: string; itens: typeof hosp.escala }> = []
  for (const e of hosp.escala) {
    const last = grupos[grupos.length - 1]
    if (last && last.servico === e.servico) last.itens.push(e)
    else grupos.push({ servico: e.servico, itens: [e] })
  }

  async function remover(id: number) {
    if (!confirm('Remover este profissional da escala do hospital?')) return
    try {
      await apiFetch(`/hospital-escala/${id}`, { method: 'DELETE' })
      onToast('Removido da escala')
      onChanged()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) }
  }

  return (
    <Layout title={title} subtitle={`${hosp.internados} internados · ${hosp.escala.length} profissionais na escala${hosp.regiao ? ` · ${hosp.regiao}` : ''}`}>
      <style>{localStyles}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <StatMini label="Internados" value={hosp.internados} />
        <StatMini label="Enfermeiros" value={enfermeiros} />
        <StatMini label="Médicos Auditores" value={medicos} />
        <StatMini label="Serviços" value={servicos} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Pacientes internados */}
        <div className="card">
          <div className="card-header"><div className="card-title">Pacientes Internados</div></div>
          <div className="card-body">
            {hosp.internacoes.length > 0 ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {hosp.internacoes.slice(0, 15).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                    <div className="flex-1 truncate">
                      <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{p.nome || `Paciente #${p.atendimento}`}</div>
                      <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{p.leito || '—'} · {p.dias || 0}d internado</div>
                    </div>
                    {p.status_relatorio && <StatusBadge sr={p.status_relatorio} />}
                  </div>
                ))}
                {hosp.internacoes.length > 15 && (
                  <div style={{ textAlign: 'center', padding: 8, fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>+ {hosp.internacoes.length - 15} outros</div>
                )}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Nenhum paciente internado</div>
              </div>
            )}
          </div>
        </div>

        {/* Escala de auditores */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Escala de Auditores</div>
            <button className="btn btn-outline btn-sm" onClick={() => setAddForm((v) => !v)}>Adicionar</button>
          </div>
          <div className="card-body">
            {addForm && (
              <AddEscalaHospForm
                hosp={hosp}
                opKey={opSel.key}
                profs={profs}
                onClose={() => setAddForm(false)}
                onToast={onToast}
                onChanged={onChanged}
              />
            )}
            {hosp.escala.length > 0 ? (
              grupos.map((g, gi) => (
                <div key={g.servico}>
                  {gi > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />}
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{SERVICO_LABEL[g.servico] || g.servico}</div>
                  {g.itens.map((e) => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 4 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: e.profissional_tipo === 'E' ? 'var(--success-bg)' : 'var(--primary-soft)', color: e.profissional_tipo === 'E' ? 'var(--success)' : 'var(--primary)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{e.profissional_tipo}</div>
                      <div className="flex-1 truncate">
                        <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{e.profissional_nome}</div>
                        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{e.servico}</div>
                      </div>
                      <button onClick={() => remover(e.id)} title="Remover" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)', padding: '2px 4px', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Nenhum profissional na escala</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => onToast('')} />}
    </Layout>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────
function StatMini({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="stat-mini">
      <div className="stat-mini-val" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-mini-label">{label}</div>
    </div>
  )
}

function NumField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="config-field">
      <label>{label}</label>
      <div className="cfg-num-wrap">
        <input type="number" className="cfg-num-field" value={value} min={0} onChange={(e) => onChange(parseInt(e.target.value) || 0)} />
        <div className="cfg-num-suffix">dias</div>
      </div>
      {hint && <div className="config-hint">{hint}</div>}
    </div>
  )
}

function AddHospitalForm({ opKey, onClose, onToast, onChanged }: { opKey: string; onClose: () => void; onToast: (m: string) => void; onChanged: () => void }) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  async function criar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome do hospital'); return }
    setSaving(true)
    try {
      const key = n.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
      const d = await apiFetch<{ ok?: boolean; criado?: boolean }>('/configuracoes/hospital', { method: 'POST', body: { nome: n, operadora_key: opKey, key } })
      if (d.ok || d.criado) { onToast('✓ Hospital adicionado'); onChanged(); onClose() }
      else onToast('Erro ao adicionar hospital')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12 }}>
      <div className="uppercase t-muted" style={{ marginBottom: 8, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Novo hospital</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <input type="text" className="bm-input" placeholder="Nome do hospital" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={criar} disabled={saving}>Adicionar</button>
        </div>
      </div>
    </div>
  )
}

function AddEscalaHospForm({ hosp, opKey, profs, onClose, onToast, onChanged }: {
  hosp: HospitalSelected
  opKey: string
  profs: Profissional[]
  onClose: () => void
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const [prof, setProf] = useState('')
  const [servico, setServico] = useState('P')
  const [saving, setSaving] = useState(false)

  async function adicionar() {
    if (!prof) { onToast('Selecione o profissional'); return }
    setSaving(true)
    try {
      await apiFetch('/hospital-escala', {
        method: 'POST',
        body: { hospital_key: hosp.key, hospital_nome: hosp.nome, operadora_key: opKey, servico, profissional_id: parseInt(prof) },
      })
      onToast('✓ Profissional adicionado à escala')
      onChanged()
      onClose()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  const labelStyle = { display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={labelStyle}>Profissional</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={prof} onChange={(e) => setProf(e.target.value)}>
            <option value="">Selecione…</option>
            {profs.map((p) => <option key={p.id} value={p.id}>[{p.tipo}] {p.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Serviço</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s} value={s}>{s} — {SERVICO_LABEL[s]}</option>)}
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

function NovaOperadoraModal({ onClose, onDone, onError }: { onClose: () => void; onDone: (key: string) => void; onError: (m: string) => void }) {
  const [nome, setNome] = useState('')
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)

  async function criar() {
    if (!nome.trim() || !key.trim()) { onError('Preencha nome e chave'); return }
    setSaving(true)
    try {
      const d = await apiFetch<{ ok?: boolean; criado?: boolean }>('/configuracoes/operadora', { method: 'POST', body: { nome: nome.trim(), key: key.trim() } })
      if (d.ok || d.criado) onDone(key.trim())
      else onError('Erro: chave já existe?')
    } catch (e) { onError(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  return (
    <Modal title="Nova Operadora" onClose={onClose} footer={
      <>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={criar} disabled={saving}>{saving ? 'Criando…' : 'Criar operadora'}</button>
      </>
    }>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div className="uppercase t-muted" style={{ marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Nome da operadora *</div>
          <input type="text" className="bm-input" placeholder="Ex: Amil Saúde" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div>
          <div className="uppercase t-muted" style={{ marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Chave / ID (sem espaços) *</div>
          <input type="text" className="bm-input" placeholder="Ex: amil" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
        </div>
      </div>
    </Modal>
  )
}
