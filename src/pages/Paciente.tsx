// Tela de detalhe (ficha completa) de uma internação: reproduz a página
// /paciente/{id} do app legado (bmais-auditoria). Aberta a partir do botão
// "Detalhes" no PacienteDrawer.
//
// Orquestrador: busca os dados, decide permissões e compõe os cards de
// components/paciente/. Regras de exibição e de edição moram lá.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import Toast from '../components/Toast'
import { LoadingState } from '../components/ui'
import HospitalDetalhesModal from '../components/HospitalDetalhesModal'
import { alertaStyles } from '../components/Alerta'
import { AlertaCamposFaltantes } from '../components/paciente/AlertaCamposFaltantes'
import { CardCids } from '../components/paciente/CardCids'
import { CardDadosPaciente } from '../components/paciente/CardDadosPaciente'
import { CardRelatorios } from '../components/paciente/CardRelatorios'
import { KpisPaciente } from '../components/paciente/KpisPaciente'
import { SubtituloPaciente } from '../components/paciente/SubtituloPaciente'
import { useEdicaoFicha } from '../components/paciente/useEdicaoFicha'
import { TimelineEventos } from '../components/timeline/TimelineEventos'
import { useInternacaoDados, useInternacaoRelatorios, useInternacaoTimeline } from '../hooks/useInternacao'
import { useEquipe } from '../hooks/useEquipe'
import { useAuth } from '../auth/AuthContext'
import { podeExecutar, podeVer } from '../auth/permissions'
import { identificacaoPaciente } from '../lib/texto'
import { camposIncompletos, type CampoFicha } from '../lib/fichaIncompleta'

// O último card da coluna esquerda ocupa a altura que sobrar quando a coluna da
// direita é a mais alta. É o de CIDs, ou o de dados quando o de CIDs não aparece.
const colunaStyles = `.ficha-col>.card:last-child{flex:1}`

export default function Paciente() {
  const { id } = useParams<{ id: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()
  const { role } = useAuth()

  const idInvalido = !id || Number.isNaN(internacaoId)
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const timeline = useInternacaoTimeline(internacaoId)
  const relatorios = useInternacaoRelatorios(internacaoId)
  const { data: equipe } = useEquipe()
  const medicos = useMemo(
    () => (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo)).map((m) => m.nome),
    [equipe],
  )

  const [toast, setToast] = useState<string | null>(null)
  // Ficha do hospital, aberta pelo nome no subtítulo da página.
  const [hospitalAberto, setHospitalAberto] = useState(false)
  const edicao = useEdicaoFicha(internacaoId, d, { onSalvo: setToast })

  // Campos importantes que o censo não trouxe. O aviso é do DADO GRAVADO: enquanto
  // edita, cada campo some do destaque sozinho (ver `aindaFalta` em CampoFicha),
  // mas a lista do topo só muda depois de salvar, quando `d` volta do servidor.
  const faltantes = useMemo(() => (d ? camposIncompletos(d) : []), [d])
  const faltaCampo = useMemo(() => new Set<CampoFicha>(faltantes.map((f) => f.campo)), [faltantes])

  const sr = d?.status_relatorio || ''

  // Topbar da página: título com o nome + subtítulo com atendimento/hospital,
  // e ação "Voltar" à direita. Publicado no header persistente do AppLayout.
  usePageHeader(
    useMemo(
      () => ({
        title: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {d ? identificacaoPaciente(d) : isLoading ? '—' : 'Paciente'}
            {sr && <StatusBadge sr={sr} />}
          </span>
        ),
        subtitle: d ? (
          <>
            <SubtituloPaciente d={d} onAbrirHospital={() => setHospitalAberto(true)} />
            {d.dias != null && <> · {d.dias}d internado</>}
            {d.gatilho != null && <> (gatilho: {d.gatilho}d)</>}
          </>
        ) : undefined,
        actions: (
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Voltar
          </button>
        ),
      }),
      [d, sr, isLoading, navigate],
    ),
  )

  if (idInvalido) return <div className="empty-state">Paciente inválido.</div>
  if (isLoading) return <LoadingState />
  if (isError || !d) return <div className="empty-state">Não foi possível carregar os dados do paciente.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{alertaStyles + colunaStyles}</style>
      <KpisPaciente d={d} />
      {!edicao.editando && <AlertaCamposFaltantes faltantes={faltantes} />}

      {/* Grid: dados e CIDs à esquerda, relatórios/timeline à direita.
          alignItems:stretch faz a coluna direita ter a mesma altura da coluna de
          dados; a Timeline preenche o espaço restante e rola por dentro. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 16, alignItems: 'stretch' }}>
        <div className="ficha-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <CardDadosPaciente d={d} edicao={edicao} faltaCampo={faltaCampo} />
          <CardCids
            internacaoId={internacaoId}
            sexoPaciente={d.sexo}
            podeEditar={podeExecutar(role, 'atribuirCid')}
            onAlterado={setToast}
          />
        </div>

        {/* min-height:0 permite o card Timeline encolher e rolar por dentro em
            vez de esticar a coluna. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, minHeight: 0 }}>
          <CardRelatorios
            internacaoId={internacaoId}
            relatorios={relatorios.data?.relatorios}
            carregando={relatorios.isLoading}
            erro={relatorios.isError}
            podeRegistrar={podeExecutar(role, 'registrarRelatorio')}
            medicos={medicos}
            onRegistrado={() => setToast('✓ Relatório registrado')}
          />

          <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <div className="card-title">Timeline</div>
              <span className="badge muted">{timeline.data?.eventos.length ?? 0}</span>
            </div>
            <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <TimelineEventos
                eventos={timeline.data?.eventos}
                carregando={timeline.isLoading}
                erro={timeline.isError}
                className="tl tl-scroll"
              />
            </div>
          </div>
        </div>
      </div>

      {hospitalAberto && d.hospital_key && (
        <HospitalDetalhesModal
          hospital={{ key: d.hospital_key, nome: d.hospital_nome || d.hospital_key }}
          onClose={() => setHospitalAberto(false)}
          // Mesma regra do painel: o atalho para a ficha editável só existe para
          // quem tem a tela de Configurações.
          onAbrirCadastro={
            podeVer(role, 'configuracoes')
              ? (key) => { setHospitalAberto(false); navigate(`/configuracoes?hospital=${encodeURIComponent(key)}`) }
              : undefined
          }
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
