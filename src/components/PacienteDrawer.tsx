import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type { InternacaoDados } from '../types/api'
import { StatusBadge, LeitoTag } from './StatusBadge'

function hojeISO(): string {
  // Data local em YYYY-MM-DD (sem depender de UTC).
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

interface Props {
  internacaoId: number
  onClose: () => void
  onSaved: (msg: string) => void
}

export default function PacienteDrawer({ internacaoId, onClose, onSaved }: Props) {
  const { data: d, isLoading, isError } = useQuery({
    queryKey: ['internacao-dados', internacaoId],
    queryFn: () => apiFetch<InternacaoDados>(`/internacao/${internacaoId}/dados`),
  })

  const [dataVisita, setDataVisita] = useState(hojeISO())
  const [medico, setMedico] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function salvar() {
    if (!dataVisita) {
      setErro('Informe a data da visita')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      await apiFetch(`/internacao/${internacaoId}/relatorio-rapido`, {
        method: 'POST',
        body: { data_visita: dataVisita, medico, descricao: obs, autor: 'operador' },
      })
      onSaved('✓ Relatório registrado')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao registrar')
    } finally {
      setSalvando(false)
    }
  }

  const sr = d?.status_relatorio || ''
  const danger = sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL'
  const warning = sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO'
  const barColor = danger ? 'var(--danger)' : warning ? 'var(--warning)' : 'var(--ink-2)'

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ display: 'flex' }}>
        <div className="drawer-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div>{sr && <StatusBadge sr={sr} />}</div>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-lg)', fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d?.nome || (isLoading ? '—' : 'Paciente')}
            </div>
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {d && (
                <>
                  Atend. <span className="mono">{d.atendimento || '—'}</span> · {d.hospital_nome || '—'}
                </>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {isLoading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted-2)' }}>Carregando…</div>}
          {isError && <div className="empty-state">Não foi possível carregar os dados.</div>}
          {d && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
                <div className="dk">
                  <div className="dk-label">Dias internado</div>
                  <div className="dk-value">{d.dias ?? '—'}</div>
                  <div className="dk-meta">desde {d.data_entrada || '—'}</div>
                </div>
                <div className="dk" style={danger ? { background: 'var(--danger-bg)', borderColor: 'rgba(200,36,60,.2)' } : undefined}>
                  <div className="dk-bar" style={{ background: barColor }} />
                  <div className="dk-label" style={danger ? { color: 'var(--danger)' } : undefined}>Sem relatório</div>
                  <div className="dk-value" style={danger ? { color: 'var(--danger)' } : undefined}>{d.dias_sem_relatorio ?? '—'}d</div>
                  <div className="dk-meta">Janela: {d.janela_relatorio || '—'}d</div>
                </div>
                <div className="dk">
                  <div className="dk-label">Leito</div>
                  <div style={{ marginTop: 6 }}><LeitoTag tipo={d.tipo_leito} /></div>
                  <div className="dk-meta">Gatilho: {d.gatilho || '—'}d</div>
                </div>
              </div>

              <div className="section-label" style={{ margin: '0 0 12px' }}>Timeline da internação</div>
              <div className="tl">
                <div className="tl-item">
                  <div className="tl-dot" />
                  <div className="tl-date">{d.data_entrada || '—'}</div>
                  <div className="tl-label">Admissão</div>
                  <div className="tl-desc">{d.hospital_nome || ''} · {d.tipo_leito || '—'}</div>
                </div>
                {d.data_ultima_visita && (
                  <div className="tl-item">
                    <div className="tl-dot" />
                    <div className="tl-date">{d.data_ultima_visita}</div>
                    <div className="tl-label">Última visita</div>
                    <div className="tl-desc">Relatório registrado</div>
                  </div>
                )}
                {(danger || warning) && (
                  <div className="tl-item">
                    <div className="tl-dot danger" />
                    <div className="tl-date">Hoje</div>
                    <div className="tl-label" style={{ color: 'var(--danger)' }}>Pendente</div>
                    <div className="tl-desc">{d.dias_sem_relatorio ?? ''}d sem relatório</div>
                  </div>
                )}
              </div>

              <div className="section-label" style={{ marginTop: 22 }}>Registrar relatório</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Data da visita *</div>
                    <input type="date" className="bm-input" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
                  </div>
                  <div>
                    <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Médico auditor</div>
                    <input type="text" className="bm-input" placeholder="nome do médico" value={medico} onChange={(e) => setMedico(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Observação</div>
                  <textarea className="bm-input" rows={3} placeholder="Observações técnicas do auditor…" style={{ resize: 'vertical', fontFamily: 'inherit' }} value={obs} onChange={(e) => setObs(e.target.value)} />
                </div>
                {erro && <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>{erro}</div>}
              </div>
            </>
          )}
        </div>

        <div className="drawer-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={onClose}>Fechar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={salvando || !d}>
            {salvando ? 'Registrando…' : 'Registrar relatório'}
          </button>
        </div>
      </div>
    </>
  )
}
