import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { StatusBadge, LeitoTag, AutorChip, MedicoChip, roleVisual } from './StatusBadge'
import { LoadingState } from './ui'
import MedicoCombobox from './MedicoCombobox'
import { useInternacaoDados, useInternacaoTimeline } from '../hooks/useInternacao'
import { useEquipe } from '../hooks/useEquipe'
import { useAuth } from '../auth/AuthContext'
import { podeExecutar } from '../auth/permissions'
import { registrarRelatorioRapido } from '../services/internacao.service'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import { hojeISO } from '../lib/datas'
import { nomeProprio } from '../lib/texto'
import type { TimelineEvento } from '../types/api'

interface Props {
  internacaoId: number
  onClose: () => void
  onSaved: (msg: string) => void
}

export default function PacienteDrawer({ internacaoId, onClose, onSaved }: Props) {
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const { data: tl, isLoading: tlLoading, isError: tlError } = useInternacaoTimeline(internacaoId)
  const { data: equipe } = useEquipe()
  const { role } = useAuth()
  // Registrar relatório é ação exclusiva do perfil técnico (admin supervisiona).
  // Demais papéis veem o drawer somente-leitura (KPIs + timeline).
  const podeRegistrar = podeExecutar(role, 'registrarRelatorio')
  // Médicos auditores (tipo 'M') ativos, cadastrados na tela de Equipe.
  const medicosAtivos = (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo))
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
      // Invalida a timeline/dados deste paciente para o novo relatório aparecer
      // ao reabrir o drawer.
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(internacaoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoRelatorios(internacaoId) })
      // Evento de domínio: o relatório muda o status_relatorio do paciente, então
      // o Kanban (sai de "Sem relatório"/"Vencidos") e os agregados por status
      // (Dashboard/Diretoria/Gestor/Sidebar) precisam refazer o fetch.
      invalidarPorEvento(queryClient, 'relatorioAdicionado')
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
              {nomeProprio(d?.nome) || (isLoading ? '—' : 'Paciente')}
            </div>
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {d && (
                <>
                  Atend. <span className="mono">{d.atendimento || '—'}</span> · {d.hospital_nome || '—'}
                </>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
            onClick={() => navigate(`/paciente/${internacaoId}`)}
            title="Abrir a ficha completa deste paciente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>
            Ver completo
          </button>
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
              {tlLoading && <LoadingState label="Carregando timeline…" size={22} style={{ padding: '24px 8px' }} />}
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

              {podeRegistrar && (
                <>
                  <div className="section-label" style={{ marginTop: 22 }}>Registrar relatório</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Data da visita *</div>
                        <input type="date" className="bm-input" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
                      </div>
                      <div>
                        <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Médico auditor</div>
                        <MedicoCombobox
                          value={medico}
                          onChange={setMedico}
                          nomes={medicosAtivos.map((m) => m.nome)}
                        />
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
            </>
          )}
        </div>

        <div className="drawer-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={onClose}>Fechar</button>
          {podeRegistrar && (
            <button className="btn btn-primary" onClick={salvar} disabled={salvando || !d}>
              {salvando ? 'Registrando…' : 'Registrar relatório'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function TimelineItem({ ev }: { ev: TimelineEvento }) {
  const relatorio = ev.tipo === 'RELATORIO' || /relat[óo]rio/i.test(ev.titulo)
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  // Relatório: mostra só o médico responsável. Demais eventos com autoria humana
  // (edição manual, observação) mostram o usuário que registrou. Marcos sintéticos
  // e eventos de sistema não têm autoria e não exibem chip.
  const chipRelatorio = relatorio && Boolean(ev.medico)
  const chipAutor = !relatorio && Boolean(ev.autor)
  // Relatório: marcador colorido pelo papel de quem registrou.
  const dotStyle = relatorio ? { background: roleVisual(ev.autor_role).color } : undefined
  return (
    <div className="tl-item">
      <div className={`tl-dot ${ev.variante}`} style={dotStyle} />
      <div className="tl-date">{ev.hoje ? 'Hoje' : ev.data || '—'}</div>
      <div className="tl-label" style={labelStyle}>
        {ev.titulo}
        {chipRelatorio && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.medico!} role={ev.autor_role} />
          </span>
        )}
        {chipAutor && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <AutorChip role={ev.autor_role} autor={ev.autor} />
          </span>
        )}
      </div>
      {ev.descricao && <div className="tl-desc">{ev.descricao}</div>}
    </div>
  )
}
