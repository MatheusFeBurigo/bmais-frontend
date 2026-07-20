import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { StatusBadge, LeitoTag } from './StatusBadge'
import { LoadingState, Spinner } from './ui'
import { useInternacaoDados, useInternacaoTimeline } from '../hooks/useInternacao'
import { registrarRelatorioRapido } from '../services/internacao.service'
import { queryKeys } from '../lib/queryKeys'
import { hojeISO } from '../lib/datas'
import type { TimelineEvento } from '../types/api'

interface Props {
  internacaoId: number
  onClose: () => void
  onSaved: (msg: string) => void
}

export default function PacienteDrawer({ internacaoId, onClose, onSaved }: Props) {
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const { data: tl, isLoading: tlLoading, isError: tlError } = useInternacaoTimeline(internacaoId)
  const queryClient = useQueryClient()

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
      await registrarRelatorioRapido(internacaoId, {
        data_visita: dataVisita, medico, descricao: obs,
      })
      // Invalida a timeline para o novo relatório aparecer ao reabrir o drawer.
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(internacaoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
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
          {isLoading && <LoadingState />}
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
              {tlLoading && <Spinner />}
              {tlError && <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar a timeline.</div>}
              {tl && tl.eventos.length === 0 && (
                <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Sem eventos registrados.</div>
              )}
              {tl && tl.eventos.length > 0 && (
                <div className="tl">
                  {tl.eventos.map((ev, i) => (
                    <TimelineItem key={i} ev={ev} />
                  ))}
                </div>
              )}

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

function TimelineItem({ ev }: { ev: TimelineEvento }) {
  const dotClass = `tl-dot ${ev.variante}`
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  return (
    <div className="tl-item">
      <div className={dotClass} />
      <div className="tl-date">{ev.hoje ? 'Hoje' : ev.data || '—'}</div>
      <div className="tl-label" style={labelStyle}>{ev.titulo}</div>
      {ev.descricao && <div className="tl-desc">{ev.descricao}</div>}
    </div>
  )
}
