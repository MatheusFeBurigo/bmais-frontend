// Drawer do paciente, aberto a partir das listas (Visão Geral, Gestor, Tarefas).
// Resumo da internação + timeline + ações rápidas (registrar relatório, agendar
// visita). As peças são as mesmas da ficha completa (components/paciente/ e
// components/timeline/); aqui só se compõe.
//
// As ações rápidas estão OCULTAS desde 08/10/2026 (`ACOES_NO_PAINEL`, em
// lib/recursos): o relatório se registra pela modal da ficha Detalhes.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge, LeitoTag } from './StatusBadge'
import { LoadingState } from './ui'
import HospitalDetalhesModal from './HospitalDetalhesModal'
import { AcaoAlta } from './paciente/AcaoAlta'
import { BlocoAgendarVisita } from './paciente/BlocoAgendarVisita'
import { BlocoRegistrarRelatorio } from './paciente/BlocoRegistrarRelatorio'
import { SubtituloPaciente } from './paciente/SubtituloPaciente'
import { useFormRelatorio } from './paciente/useFormRelatorio'
import { TimelineEventos } from './timeline/TimelineEventos'
import { useInternacaoDados, useInternacaoTimeline } from '../hooks/useInternacao'
import { useEquipe } from '../hooks/useEquipe'
import { useAuth } from '../auth/AuthContext'
import { podeExecutar, podeVerFichaPaciente } from '../auth/permissions'
import { ACOES_NO_PAINEL } from '../lib/recursos'
import { corDaGravidade, gravidadeDoStatus, KPI_PERIGO } from '../lib/statusRelatorio'
import { identificacaoPaciente } from '../lib/texto'
import { useTravarScroll } from '../lib/travarScroll'
import type { InternacaoDados } from '../types/api'

interface Props {
  internacaoId: number
  onClose: () => void
  onSaved: (msg: string) => void
}

function KpisDrawer({ d }: { d: InternacaoDados }) {
  const gravidade = gravidadeDoStatus(d.status_relatorio)
  const perigo = gravidade === 'perigo'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
      <div className="dk">
        <div className="dk-label">Dias internado</div>
        <div className="dk-value">{d.dias ?? '—'}</div>
        <div className="dk-meta">desde {d.data_entrada || '—'}</div>
      </div>
      <div className="dk" style={perigo ? KPI_PERIGO.cartao : undefined}>
        <div className="dk-bar" style={{ background: corDaGravidade(gravidade) }} />
        <div className="dk-label" style={perigo ? KPI_PERIGO.texto : undefined}>Sem relatório</div>
        <div className="dk-value" style={perigo ? KPI_PERIGO.texto : undefined}>{d.dias_sem_relatorio ?? '—'}d</div>
        <div className="dk-meta">Janela: {d.janela_relatorio || '—'}d</div>
      </div>
      <div className="dk">
        <div className="dk-label">Leito</div>
        <div style={{ marginTop: 6 }}><LeitoTag tipo={d.tipo_leito} /></div>
        <div className="dk-meta">Gatilho: {d.gatilho || '—'}d</div>
      </div>
    </div>
  )
}

export default function PacienteDrawer({ internacaoId, onClose, onSaved }: Props) {
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const timeline = useInternacaoTimeline(internacaoId)
  const { data: equipe } = useEquipe()
  const { role } = useAuth()
  const navigate = useNavigate()
  // Ações exclusivas do perfil técnico (admin supervisiona). Demais papéis veem
  // o drawer somente-leitura (KPIs + timeline).
  const podeRegistrar = ACOES_NO_PAINEL && podeExecutar(role, 'registrarRelatorio')
  const podeAgendar = ACOES_NO_PAINEL && podeExecutar(role, 'agendarVisita')
  const podeDarAlta = podeExecutar(role, 'darAlta')
  const medicos = useMemo(
    () => (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo)).map((m) => m.nome),
    [equipe],
  )
  // Data vazia por padrão, como no "Agendar visita": o botão nasce cinza até o
  // técnico confirmar a data, em vez de já ativo com hoje pré-preenchido.
  const formRelatorio = useFormRelatorio(internacaoId, {
    dataInicial: () => '',
    onRegistrado: (pendente) => onSaved(pendente ? '✓ Relatório enviado para aprovação' : '✓ Relatório registrado'),
  })
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

  const sr = d?.status_relatorio || ''

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ display: 'flex' }}>
        <div className="drawer-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div>{sr && <StatusBadge sr={sr} emAprovacao={d?.relatorio_em_aprovacao} />}</div>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-lg)', fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d ? identificacaoPaciente(d) : isLoading ? '—' : 'Paciente'}
            </div>
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              {d && <SubtituloPaciente d={d} onAbrirHospital={() => setHospitalAberto(true)} />}
            </div>
          </div>
          {/* No topo, ao lado do X: é a saída do drawer para a ficha completa.
              Vale para todos os papéis menos o analista interno, que vê o
              drawer mas não abre a ficha (podeVerFichaPaciente). */}
          {podeVerFichaPaciente(role) && (
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
            onClick={() => navigate(`/paciente/${internacaoId}`)}
            title="Abrir a ficha completa deste paciente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>
            Detalhes
          </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {isLoading && <LoadingState />}
          {isError && <div className="empty-state">Não foi possível carregar os dados.</div>}
          {d && (
            <>
              <KpisDrawer d={d} />

              <div className="section-label" style={{ margin: '0 0 12px' }}>Timeline da internação</div>
              {/* Altura limitada + scroll PRÓPRIO: sem isso a timeline crescia com
                  o histórico e empurrava as ações para baixo do drawer.
                  `max-height` (não `flex:1`, como a ficha usa) porque aqui o pai
                  já rola inteiro (`drawer-body`). */}
              <TimelineEventos
                eventos={timeline.data?.eventos}
                carregando={timeline.isLoading}
                erro={timeline.isError}
                style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}
              />

              {(podeRegistrar || podeAgendar) && <div className="section-label" style={{ marginTop: 24 }}>Ações</div>}
              {podeRegistrar && <BlocoRegistrarRelatorio form={formRelatorio} medicos={medicos} />}

              {/* Agendar fica DEPOIS de registrar: o caso frequente é lançar a
                  visita que acabou de acontecer, e o compromisso futuro é a
                  exceção. Blocos separados, com botões próprios, para não
                  confundir a data prevista com a data realizada. */}
              {podeAgendar && <BlocoAgendarVisita d={d} />}
            </>
          )}
        </div>

        <div className="drawer-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          {/* À esquerda do Fechar, longe das ações do corpo: a alta tira o
              paciente da lista, e não pode ser confundido com salvar um relatório. */}
          {podeDarAlta && d && (
            <div style={{ marginRight: 'auto' }}>
              <AcaoAlta d={d} sobreposta pequeno={false} onFeito={onSaved} />
            </div>
          )}
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
