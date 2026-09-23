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
import { dataBR } from '../lib/datas'
import { ordenarRecentePrimeiro, classeDoEvento } from '../lib/timeline'
import { useAgendarVisita } from './kanban/useAgendarVisita'
import { SeletorVisita } from './kanban/SeletorVisita'
import { CalendarioVisita } from './kanban/CalendarioVisita'
import { identificacaoPaciente } from '../lib/texto'
import { useTravarScroll } from '../lib/travarScroll'
import HospitalDetalhesModal from './HospitalDetalhesModal'
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
  // Agendar visita: o mesmo par de papéis, em permissão própria.
  const podeAgendar = podeExecutar(role, 'agendarVisita')
  // Médicos auditores (tipo 'M') ativos, cadastrados na tela de Equipe.
  const medicosAtivos = (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo))
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Vazio por padrão, como o campo de "Agendar visita": o botão nasce cinza
  // até o técnico confirmar a data, em vez de já ativo com hoje pré-preenchido
  // — que fazia parecer disponível antes de qualquer decisão do usuário.
  const [dataVisita, setDataVisita] = useState('')
  // Agendamento: estado próprio, separado do formulário de relatório. As duas
  // datas significam coisas opostas (prevista x realizada) e não podem se
  // misturar num só formulário.
  const [dataAgenda, setDataAgenda] = useState('')
  const [horaAgenda, setHoraAgenda] = useState('')
  const [medicoAgenda, setMedicoAgenda] = useState('')
  const agenda = useAgendarVisita(internacaoId)
  const [medico, setMedico] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Ficha do hospital sobre o drawer: quem lê a timeline muitas vezes precisa do
  // contato da casa (ligar para a enfermagem) sem perder o paciente aberto.
  const [hospitalAberto, setHospitalAberto] = useState(false)

  // O drawer cobre a tela com backdrop: a lista de trás fica congelada no ponto
  // em que estava, para o paciente aberto continuar sendo o mesmo ao fechar.
  useTravarScroll()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Com a ficha do hospital por cima, o Escape fecha só ela: fechar as duas
      // camadas de uma vez tiraria o paciente da frente sem o usuário pedir.
      if (e.key !== 'Escape') return
      if (hospitalAberto) setHospitalAberto(false)
      else onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, hospitalAberto])

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
              {d ? identificacaoPaciente(d) : isLoading ? '—' : 'Paciente'}
            </div>
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {d && (
                <>
                  Atend. <span className="mono">{d.atendimento || '—'}</span> ·{' '}
                  {d.hospital_key && d.hospital_nome ? (
                    <button
                      type="button"
                      className="link-cell"
                      title={`Ver detalhes de ${d.hospital_nome}`}
                      onClick={() => setHospitalAberto(true)}
                    >
                      {d.hospital_nome}
                    </button>
                  ) : (
                    d.hospital_nome || '—'
                  )}
                </>
              )}
            </div>
          </div>
          {/* Volta a ficar no topo, ao lado do X: é a saída do drawer para a
              ficha completa, e vale para TODOS os papéis — quem não registra
              relatório também precisa chegar lá. */}
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
            onClick={() => navigate(`/paciente/${internacaoId}`)}
            title="Abrir a ficha completa deste paciente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>
            Detalhes
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
                // Altura limitada + scroll PRÓPRIO: sem isso a timeline crescia
                // junto do histórico do paciente e empurrava "Registrar
                // relatório"/"Agendar visita" cada vez mais para baixo do
                // drawer. `max-height` (não `flex:1`, como a página completa
                // usa) porque aqui o pai é uma coluna que já rola inteira
                // (`drawer-body`), não um container de altura travada pelo
                // viewport. Mais recente no topo — mesma ordem da página.
                <div className="tl" style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {ordenarRecentePrimeiro(tl.eventos).map((ev, i) => (
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
                        {/* "realizada" e o `max` de hoje: com um campo de data
                            PREVISTA no bloco de agendar, o rótulo antigo ("Data da
                            visita") convidava a registrar relatório de visita
                            futura, que quebraria o cálculo de dias sem relatório. */}
                        <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Data da visita realizada *</div>
                        <CalendarioVisita valor={dataVisita} onEscolher={setDataVisita} limite="passado" placeholder="Escolher data" />
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
                  {/* O botão fica FORA do grid dos campos: dentro dele, o
                      `display:grid` esticava o botão por toda a largura, e ele
                      não se parecia com o "Agendar visita" logo abaixo. As duas
                      ações do drawer são irmãs e têm o mesmo formato. */}
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 10 }}
                    onClick={salvar}
                    disabled={salvando || !d || !dataVisita}
                  >
                    {salvando ? 'Registrando…' : 'Registrar relatório'}
                  </button>
                </>
              )}

              {/* Agendar fica DEPOIS de registrar: o caso frequente é lançar a
                  visita que acabou de acontecer, e o compromisso futuro é a
                  exceção. Continuam em blocos separados, com botões próprios,
                  para não confundir a data prevista com a data realizada. */}
              {podeAgendar && (
                <>
                  <div className="section-label" style={{ marginTop: 22 }}>Agendar visita</div>
                  {d.visita_agendada ? (
                    <div className="dk" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--t-md)', color: d.visita_agendada_vencida ? 'var(--danger)' : 'var(--ink-2)' }}>
                          {d.visita_agendada_vencida
                            ? `Visita atrasada, era ${dataBR(d.visita_agendada_em)}`
                            : `Visita marcada para ${dataBR(d.visita_agendada_em)}`}
                          {d.visita_agendada_hora && ` às ${d.visita_agendada_hora.slice(0, 5)}`}
                        </div>
                        {d.visita_agendada_medico && (
                          <div className="dk-meta">Responsável: {d.visita_agendada_medico}</div>
                        )}
                        {d.visita_agendada_por && (
                          <div className="dk-meta">Marcada por {d.visita_agendada_por}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={agenda.salvando}
                        onClick={() => void agenda.desmarcar()}
                      >
                        {agenda.salvando ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <SeletorVisita
                        data={dataAgenda}
                        onData={setDataAgenda}
                        hora={horaAgenda}
                        onHora={setHoraAgenda}
                        medico={medicoAgenda}
                        onMedico={setMedicoAgenda}
                      />
                      {/* Médico e horário obrigatórios: sem responsável o
                          agendamento não diz de QUEM é a visita, e sem horário
                          vira só uma data solta. Mesma regra travada de novo no
                          backend (a rota é chamável direto). */}
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ marginTop: 10 }}
                        disabled={agenda.salvando || !dataAgenda || !horaAgenda || !medicoAgenda}
                        onClick={async () => {
                          if (await agenda.agendar(dataAgenda, medicoAgenda, horaAgenda)) {
                            setDataAgenda('')
                            setHoraAgenda('')
                            setMedicoAgenda('')
                          }
                        }}
                      >
                        {agenda.salvando ? 'Agendando…' : 'Agendar visita'}
                      </button>
                    </>
                  )}
                  {agenda.erro && (
                    <div className="badge danger" style={{ marginTop: 8, padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>
                      {agenda.erro}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="drawer-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={onClose}>Fechar</button>
        </div>
      </div>

      {hospitalAberto && d?.hospital_key && (
        <HospitalDetalhesModal
          hospital={{ key: d.hospital_key, nome: d.hospital_nome || d.hospital_key }}
          onClose={() => setHospitalAberto(false)}
          sobreposta
        />
      )}
    </>
  )
}

function TimelineItem({ ev }: { ev: TimelineEvento }) {
  const relatorio = ev.tipo === 'RELATORIO' || /relat[óo]rio/i.test(ev.titulo)
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  // Relatório: mostra só o médico responsável. Visita agendada: o responsável
  // por ela (não quem clicou em agendar). Demais eventos com autoria humana
  // mostram o usuário que registrou. Marcos sintéticos e eventos de sistema não
  // têm autoria e não exibem chip.
  const chipRelatorio = relatorio && Boolean(ev.medico)
  const chipVisita = ev.tipo === 'VISITA_AGENDADA' && Boolean(ev.medico)
  const chipAutor = !relatorio && !chipVisita && Boolean(ev.autor)
  // Relatório: marcador colorido pelo papel de quem registrou. Demais tipos
  // mapeados usam a cor fixa do tipo (mesmo padrão de pages/Paciente.tsx).
  const tipoClasse = classeDoEvento(ev)
  const dotStyle = relatorio ? { background: roleVisual(ev.autor_role).color } : undefined
  const dotClass = tipoClasse || ev.variante
  const cardClass = tipoClasse && !relatorio ? ` tl-card ${tipoClasse}` : ''
  const cancelada = ev.tipo === 'VISITA_AGENDADA' && ev.status_visita === 'cancelada'
  return (
    <div className={`tl-item${cardClass}${cancelada ? ' tl-cancelada' : ''}`}>
      {/* Cancelada troca o marcador redondo por um X: o card muda de cor, mas o
          X deixa o estado "não vai mais acontecer" legível sem depender só da
          cor. Mesma mudança em pages/Paciente.tsx. */}
      {cancelada ? (
        <span className="tl-dot-x" aria-hidden>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </span>
      ) : (
        <div className={`tl-dot ${dotClass}`} style={dotStyle} />
      )}
      {/* `dataBR`: sem isso um evento como "Visita agendada" mostrava a data ISO
          crua ("2026-09-22") em vez de "22/09/2026". */}
      <div className="tl-date">
        {ev.hoje ? 'Hoje' : dataBR(ev.data) || '—'}
        {ev.tipo === 'VISITA_AGENDADA' && ev.hora && <span className="tl-hora"> às {ev.hora.slice(0, 5)}</span>}
      </div>
      <div className="tl-label" style={labelStyle}>
        <span className={cancelada ? 'tl-label-riscado' : undefined}>{ev.titulo}</span>
        {chipRelatorio && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.medico!} role={ev.autor_role} />
          </span>
        )}
        {chipVisita && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.medico!} role={ev.autor_role} titulo="Responsável" />
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
