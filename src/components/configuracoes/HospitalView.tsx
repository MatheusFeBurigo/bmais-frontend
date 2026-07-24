// Vista 3 — detalhe de hospital: pacientes internados + escala de auditores.
// Extraída de pages/Configuracoes.tsx.
import { useState } from 'react'
import type { OperadoraSelected, HospitalSelected, Profissional } from '../../types/api'
import { usePageHeader } from '../PageHeader'
import { StatusBadge } from '../StatusBadge'
import Toast from '../Toast'
import { removerEscala } from '../../services/escala.service'
import { nomeProprio } from '../../lib/texto'
import { localStyles, SERVICO_LABEL } from './configuracoes.styles'
import { StatMini } from './shared'
import { AddEscalaHospForm } from './forms'

export default function HospitalView({ opSel, hosp, profs, onNav, onToast, onChanged, toast }: {
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
      await removerEscala(id)
      onToast('Removido da escala')
      onChanged()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) }
  }

  usePageHeader({
    title,
    subtitle: `${hosp.internados} internados · ${hosp.escala.length} profissionais na escala${hosp.regiao ? ` · ${hosp.regiao}` : ''}`,
  })

  return (
    <>
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
                      <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{nomeProprio(p.nome) || `Paciente #${p.atendimento}`}</div>
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
    </>
  )
}
