// Vista 2 — configuração de regras + hospitais de uma operadora.
// Extraída de pages/Configuracoes.tsx.
import { useEffect, useState } from 'react'
import type { OperadoraSelected, OperadoraRegras } from '../../types/api'
import { usePageHeader } from '../PageHeader'
import { OpAvatar } from '../ui'
import Toast from '../Toast'
import { salvarRegrasOperadora } from '../../services/configuracoes.service'
import { localStyles } from './configuracoes.styles'
import { StatMini, NumField } from './shared'
import { AddHospitalForm } from './forms'

export default function OperadoraView({ opSel, onNav, onToast, onChanged, toast }: {
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
      const d = await salvarRegrasOperadora(opSel.key, opSel.nome, regras)
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

  usePageHeader({
    title,
    subtitle: `${s.total_internados || 0} internados · SLA ${s.sla || 0}% · ${opSel.responsaveis || '—'}`,
    actions,
  })

  return (
    <>
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
            <button className="btn btn-outline btn-sm" onClick={() => setAddHosp((val) => !val)}>Adicionar</button>
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
    </>
  )
}
