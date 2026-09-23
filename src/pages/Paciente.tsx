// Tela de detalhe (ficha completa) de uma internação — reproduz a página
// /paciente/{id} do app legado (bmais-auditoria). Aberta a partir do botão
// "Ver relatório completo" no PacienteDrawer.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePageHeader } from '../components/PageHeader'
import { StatusBadge, AutorChip, MedicoChip, roleVisual } from '../components/StatusBadge'
import MedicoCombobox from '../components/MedicoCombobox'
import Toast from '../components/Toast'
import { LoadingState } from '../components/ui'
import HospitalDetalhesModal from '../components/HospitalDetalhesModal'
import { useEditarInternacao, useInternacaoDados, useInternacaoRelatorios, useInternacaoTimeline } from '../hooks/useInternacao'
import { useEquipe } from '../hooks/useEquipe'
import { useAuth } from '../auth/AuthContext'
import { podeExecutar, podeVer } from '../auth/permissions'
import { registrarRelatorioRapido, type InternacaoEdicao } from '../services/internacao.service'
import { queryKeys } from '../lib/queryKeys'
import { invalidarPorEvento } from '../lib/invalidation'
import { hojeISO, paraISO } from '../lib/datas'
import { identificacaoPaciente, nomeProprio } from '../lib/texto'
import { camposIncompletos, type CampoFicha } from '../lib/fichaIncompleta'
import { Alerta, alertaStyles } from '../components/Alerta'
import { CalendarioVisita } from '../components/kanban/CalendarioVisita'
import type { InternacaoDados, RelatorioItem, TimelineEvento } from '../types/api'
import { dataBR, dataHora } from '../lib/datas'
import { ordenarRecentePrimeiro, classeDoEvento } from '../lib/timeline'

export default function Paciente() {
  const { id } = useParams<{ id: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()

  const idInvalido = !id || Number.isNaN(internacaoId)
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const { data: tl, isLoading: tlLoading, isError: tlError } = useInternacaoTimeline(internacaoId)
  const { data: rels, isLoading: relsLoading, isError: relsError } = useInternacaoRelatorios(internacaoId)
  const editar = useEditarInternacao(internacaoId)
  const queryClient = useQueryClient()

  // Registrar relatório: ação exclusiva do perfil técnico (admin supervisiona),
  // mesma regra do PacienteDrawer. Demais papéis veem o card somente-leitura.
  const { role } = useAuth()
  const podeRegistrar = podeExecutar(role, 'registrarRelatorio')
  const { data: equipe } = useEquipe()
  const medicosAtivos = (equipe?.medicos ?? []).filter((m) => Boolean(m.ativo))

  // Formulário inline de novo relatório dentro do card "Relatórios".
  const [registrando, setRegistrando] = useState(false)
  const [dataVisita, setDataVisita] = useState(hojeISO())
  const [medicoRel, setMedicoRel] = useState('')
  const [obsRel, setObsRel] = useState('')
  const [salvandoRel, setSalvandoRel] = useState(false)
  const [erroRel, setErroRel] = useState<string | null>(null)
  // Ficha do hospital, aberta pelo nome no subtítulo da página.
  const [hospitalAberto, setHospitalAberto] = useState(false)

  function abrirRegistro() {
    setDataVisita(hojeISO())
    setMedicoRel('')
    setObsRel('')
    setErroRel(null)
    setRegistrando(true)
  }

  function cancelarRegistro() {
    setRegistrando(false)
    setErroRel(null)
  }

  async function salvarRelatorio() {
    if (!dataVisita) {
      setErroRel('Informe a data da visita')
      return
    }
    setSalvandoRel(true)
    setErroRel(null)
    try {
      await registrarRelatorioRapido(internacaoId, {
        data_visita: dataVisita, medico: medicoRel, descricao: obsRel,
      })
      // Atualiza o card de relatórios, a timeline e os dados deste paciente.
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoRelatorios(internacaoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoTimeline(internacaoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.internacaoDados(internacaoId) })
      // O relatório muda o status_relatorio do paciente: Kanban e agregados por
      // status (Dashboard/Diretoria/Gestor/Sidebar) precisam refazer o fetch.
      invalidarPorEvento(queryClient, 'relatorioAdicionado')
      setRegistrando(false)
      setToast('✓ Relatório registrado')
    } catch (e) {
      setErroRel(e instanceof Error ? e.message : 'Falha ao registrar')
    } finally {
      setSalvandoRel(false)
    }
  }

  // Edição do card "Dados do Paciente": rascunho local aplicado sobre `d`.
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<InternacaoEdicao>({})
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Ao entrar em edição, semeia o rascunho com os valores atuais.
  function abrirEdicao() {
    if (!d) return
    setRascunho({
      nome: d.nome ?? '',
      atendimento: d.atendimento ?? '',
      // ISO: é o único formato que o <input type="date"> exibe, e o banco guarda
      // "17/08/2026". Sem converter, o campo abria VAZIO na ficha de quase todo
      // paciente — parecia dado perdido.
      data_entrada: paraISO(d.data_entrada),
      tipo_leito: d.tipo_leito ?? '',
      leito_codigo: d.leito_codigo ?? '',
      especialidade: d.especialidade ?? '',
      diagnostico: d.diagnostico ?? '',
      medico: d.medico ?? '',
      idade: d.idade ?? '',
      sexo: d.sexo ?? '',
      status: d.status ?? '',
      obs: d.obs ?? '',
    })
    setErroEdicao(null)
    setEditando(true)
  }

  function cancelarEdicao() {
    setEditando(false)
    setErroEdicao(null)
  }

  function setCampo<K extends keyof InternacaoEdicao>(campo: K, valor: string) {
    setRascunho((r) => ({ ...r, [campo]: valor }))
  }

  async function salvarEdicao() {
    setErroEdicao(null)
    try {
      // A data volta ao valor cru se não foi tocada: as que o input não exibe
      // (ano de 2 dígitos) abrem vazias, e mandar esse vazio APAGARIA a data
      // gravada. Mesma regra da modal do envio.
      const enviar: InternacaoEdicao = {
        ...rascunho,
        data_entrada: (rascunho.data_entrada === paraISO(d?.data_entrada)
          ? (d?.data_entrada ?? '')
          : (rascunho.data_entrada ?? '')),
      }
      const res = await editar.mutateAsync(enviar)
      setEditando(false)
      setToast(res.atualizado === false ? 'Nada foi alterado' : '✓ Dados atualizados')
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Falha ao salvar')
    }
  }

  // Se os dados forem recarregados enquanto edita (ex.: invalidação externa),
  // sair do modo edição evita sobrescrever com um rascunho defasado.
  useEffect(() => {
    if (!d) setEditando(false)
  }, [d])

  // Campos importantes que o censo não trouxe. O aviso é do DADO GRAVADO: enquanto
  // edita, cada campo some do destaque sozinho (ver `aindaFalta` em Campo), mas a
  // lista do topo só muda depois de salvar, quando `d` volta do servidor.
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

  if (idInvalido) {
    return <div className="empty-state">Paciente inválido.</div>
  }
  if (isLoading) {
    return <LoadingState />
  }
  if (isError || !d) {
    return <div className="empty-state">Não foi possível carregar os dados do paciente.</div>
  }

  const danger = sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL'
  const warning = sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO'
  const barColor = danger ? 'var(--danger)' : warning ? 'var(--warning)' : 'var(--ink-2)'
  const semRelatorio = danger

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{alertaStyles}</style>
      {/* ── Cards de KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <div className="dk">
          <div className="dk-bar" style={{ background: danger ? 'var(--danger)' : 'var(--ink-2)' }} />
          <div className="dk-label">Dias internado</div>
          <div className="dk-value">{d.dias ?? '—'}</div>
          <div className="dk-meta">gatilho: {d.gatilho ?? '—'}d</div>
        </div>
        <div className="dk">
          <div className="dk-label">Tipo de leito</div>
          <div style={{ marginTop: 4 }}><LeitoBig tipo={d.tipo_leito} /></div>
          <div className="dk-meta">leito {d.leito_codigo || 'n/a'}</div>
        </div>
        <div className="dk" style={semRelatorio ? { background: 'var(--danger-bg)', borderColor: 'rgba(200,36,60,.2)' } : undefined}>
          <div className="dk-bar" style={{ background: barColor }} />
          <div className="dk-label" style={semRelatorio ? { color: 'var(--danger)' } : undefined}>Última visita</div>
          <div className="dk-value" style={semRelatorio ? { color: 'var(--danger)', fontSize: 'var(--t-lg)' } : { fontSize: 'var(--t-lg)' }}>
            {dataBR(d.data_ultima_visita) || 'Sem rel.'}
          </div>
          <div className="dk-meta">
            {d.data_ultima_visita ? 'última visita' : `${d.dias_sem_relatorio ?? '—'}d sem rel.`}
          </div>
        </div>
        <div className="dk">
          <div className="dk-label">Próx. vencimento</div>
          <div className="dk-value" style={{ fontSize: 'var(--t-lg)' }}>
            {d.dias_ate_vencer != null ? `${d.dias_ate_vencer}d` : '—'}
          </div>
          <div className="dk-meta">janela: {d.janela_relatorio ?? '—'}d</div>
        </div>
      </div>

      {/* Resumo do que falta, ACIMA do card: os campos em branco estão espalhados
          pela grade, e sem ele descobrir que a ficha está incompleta exigiria varrer
          14 campos um a um. Nível "atenção" (nunca crítico): o paciente está no
          sistema e a tela funciona; o que falta é completar, e o "Editar" do próprio
          card é o caminho — por isso o alerta não repete um botão de ação. */}
      {!editando && faltantes.length > 0 && (
        <Alerta nivel="atencao">
          {faltantes.length === 1 ? (
            <>
              <b>{faltantes[0].label}</b> não veio no censo. {faltantes[0].porque}
            </>
          ) : (
            <>
              <b>{faltantes.length} campos importantes</b> não vieram no censo:{' '}
              {faltantes.map((f) => f.label).join(', ')}.
            </>
          )}
        </Alerta>
      )}

      {/* ── Grid: dados à esquerda, relatórios/timeline à direita ──
          alignItems:stretch faz a coluna direita ter a mesma altura do card de
          dados; a Timeline preenche o espaço restante e rola por dentro. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 16, alignItems: 'stretch' }}>
        {/* Dados do paciente */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div className="card-title">Dados do Paciente</div>
              <div className="card-sub">
                {d.status === 'INTERNADO' || !d.status ? 'Internação ativa' : d.status}
              </div>
            </div>
            {editando ? (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={cancelarEdicao} disabled={editar.isPending}>
                  Cancelar
                </button>
                <button className="btn btn-primary btn-sm" onClick={salvarEdicao} disabled={editar.isPending}>
                  {editar.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            ) : (
              <button className="btn btn-outline btn-sm" style={{ flexShrink: 0, gap: 6 }} onClick={abrirEdicao}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Editar
              </button>
            )}
          </div>
          <div className="card-body">
            {erroEdicao && (
              <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0, marginBottom: 12 }}>
                {erroEdicao}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <Campo label="Nome do segurado" valor={editando ? d.nome : nomeProprio(d.nome)} span={2} falta={faltaCampo.has('nome')} edit={editando} campo="nome" rascunho={rascunho} onChange={setCampo} />
              {/* Censos sem coluna de paciente identificam a internação pela senha
                  de autorização: é o único identificador que esses pacientes têm,
                  então ela precisa aparecer (e ser corrigível) na ficha. */}
              <Campo label="Senha de autorização" valor={d.senha} mono edit={editando} campo="senha" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Status" valor={d.status || 'INTERNADO'} edit={editando} campo="status" rascunho={rascunho} onChange={setCampo} opcoes={STATUS_OPCOES} />
              <Campo label="RN" valor={rnLabel(d)} />

              <Campo label="Atendimento" valor={d.atendimento} mono falta={faltaCampo.has('atendimento')} edit={editando} campo="atendimento" rascunho={rascunho} onChange={setCampo} />
              {/* Ao lado do atendimento porque são o mesmo tipo de dado visto de
                  dois lados: o número do paciente no HOSPITAL e o número dele na
                  OPERADORA. É a carteirinha que se informa ao ligar para o
                  convênio, e por isso ela precisa estar na ficha, não só na
                  conferência do envio, que some depois do upload. */}
              <Campo label="Carteirinha" valor={d.carteirinha} mono edit={editando} campo="carteirinha" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Tipo de leito" valor={d.tipo_leito} edit={editando} campo="tipo_leito" rascunho={rascunho} onChange={setCampo} opcoes={LEITO_OPCOES} />
              <Campo label="Leito / código" valor={d.leito_codigo} falta={faltaCampo.has('leito_codigo')} edit={editando} campo="leito_codigo" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Data internação" valor={d.data_entrada} mono falta={faltaCampo.has('data_entrada')} edit={editando} campo="data_entrada" rascunho={rascunho} onChange={setCampo} tipo="date" />

              <Campo label="Data alta" valor={d.status === 'INTERNADO' || !d.data_ultima_visita ? 'PERMANECE' : '—'} />
              <Campo label="Médico" valor={d.medico} edit={editando} campo="medico" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Especialidade" valor={d.especialidade} span={2} edit={editando} campo="especialidade" rascunho={rascunho} onChange={setCampo} />

              <Campo label="Diagnóstico" valor={d.diagnostico} span={4} edit={editando} campo="diagnostico" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Observações" valor={d.obs} span={4} multiline edit={editando} campo="obs" rascunho={rascunho} onChange={setCampo} />
            </div>
          </div>
        </div>

        {/* Relatórios + Timeline. min-height:0 permite o card Timeline encolher e
            rolar por dentro em vez de esticar a coluna. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, minHeight: 0 }}>
          <div className="card" style={{ flexShrink: 0 }}>
            <div className="card-header">
              <div className="card-title">Relatórios</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge muted">{rels?.relatorios.length ?? 0}</span>
                {podeRegistrar && !registrando && (
                  <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={abrirRegistro}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Registrar
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {podeRegistrar && registrando && (
                <div
                  style={{
                    border: '1px solid var(--border-strong)', borderRadius: 10,
                    padding: '14px', marginBottom: 14, background: 'var(--surface)',
                    display: 'grid', gap: 10,
                  }}
                >
                  <div className="section-label" style={{ margin: 0 }}>Novo relatório</div>
                  <div>
                    {/* "realizada": mesmo rótulo do drawer. Relatório é sempre de
                        visita que já aconteceu; a data PREVISTA tem campo próprio
                        (Agendar visita), e confundir as duas quebraria o cálculo
                        de dias sem relatório. */}
                    <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Data da visita realizada *</div>
                    <CalendarioVisita valor={dataVisita} onEscolher={setDataVisita} limite="passado" placeholder="Escolher data" />
                  </div>
                  <div>
                    <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Médico auditor</div>
                    <MedicoCombobox value={medicoRel} onChange={setMedicoRel} nomes={medicosAtivos.map((m) => m.nome)} />
                  </div>
                  <div>
                    <div className="uppercase t-muted" style={{ marginBottom: 5 }}>Observação</div>
                    <textarea className="bm-input" rows={3} placeholder="Observações técnicas do auditor…" style={{ resize: 'vertical', fontFamily: 'inherit' }} value={obsRel} onChange={(e) => setObsRel(e.target.value)} />
                  </div>
                  {erroRel && (
                    <div className="badge danger" style={{ padding: '8px 10px', textTransform: 'none', letterSpacing: 0 }}>{erroRel}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={cancelarRegistro} disabled={salvandoRel}>Cancelar</button>
                    <button className="btn btn-primary btn-sm" onClick={salvarRelatorio} disabled={salvandoRel}>
                      {salvandoRel ? 'Registrando…' : 'Registrar relatório'}
                    </button>
                  </div>
                </div>
              )}
              {relsLoading && <LoadingState label="Carregando relatórios…" size={22} style={{ padding: '24px 8px' }} />}
              {relsError && (
                <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar os relatórios.</div>
              )}
              {rels && rels.relatorios.length === 0 && !registrando && (
                <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted-2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--muted)' }}>Nenhum relatório</div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
                    {podeRegistrar ? 'Use “Registrar” para adicionar o primeiro.' : 'Nenhum registro ainda.'}
                  </div>
                </div>
              )}
              {rels && rels.relatorios.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rels.relatorios.map((r) => (
                    <RelatorioCard key={r.id} r={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <div className="card-title">Timeline</div>
              <span className="badge muted">{tl?.eventos.length ?? 0}</span>
            </div>
            <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {tlLoading && <LoadingState label="Carregando timeline…" size={22} style={{ padding: '24px 8px' }} />}
              {tlError && <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Não foi possível carregar a timeline.</div>}
              {tl && tl.eventos.length === 0 && (
                <div className="t-muted" style={{ fontSize: 'var(--t-sm)' }}>Sem eventos registrados.</div>
              )}
              {tl && tl.eventos.length > 0 && (
                <div className="tl tl-scroll">
                  {ordenarRecentePrimeiro(tl.eventos).map((ev, i) => (
                    <TimelineItem key={i} ev={ev} />
                  ))}
                </div>
              )}
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

// ── Auxiliares ──

// Opções dos campos com domínio fechado no modo edição. "" = manter em branco.
const STATUS_OPCOES = ['INTERNADO', 'ALTA', 'OBITO', 'TRANSFERIDO']
const LEITO_OPCOES = ['UTI', 'APARTAMENTO', 'ENFERMARIA']

function rnLabel(d: InternacaoDados): string {
  // "RN" (recém-nascido) não vem tipado; deriva do sexo/idade quando ausente.
  if (d.idade === '0' || d.idade === 'RN') return 'SIM'
  return 'NÃO'
}

// Evento de relatório na timeline (externo OU parecer interno). O tipo é a fonte
// confiável — o backend envia RELATORIO/RELATORIO_INTERNO. O regex no título é só
// um fallback para registros legados (e não casa "Parecer do técnico interno",
// daí a checagem por tipo ser essencial para o card interno ganhar o destaque).
function isRelatorio(ev: TimelineEvento): boolean {
  return ev.tipo === 'RELATORIO' || ev.tipo === 'RELATORIO_INTERNO' || /relat[óo]rio/i.test(ev.titulo)
}

function Campo({
  label, valor, span = 1, mono = false, multiline = false,
  edit = false, campo, rascunho, onChange, opcoes, tipo = 'text', falta = false,
}: {
  label: string
  valor?: string | number | null
  span?: number
  mono?: boolean
  multiline?: boolean
  // Modo edição: `campo` liga este input a uma chave do rascunho editável.
  // Campos somente-leitura (RN, Data alta) omitem `edit`/`campo` e nunca viram input.
  edit?: boolean
  campo?: keyof InternacaoEdicao
  rascunho?: InternacaoEdicao
  onChange?: <K extends keyof InternacaoEdicao>(campo: K, valor: string) => void
  opcoes?: string[]
  tipo?: 'text' | 'date'
  /** Campo importante que chegou em branco: destaca em âmbar e pede "informar".
   *  Vem de `camposIncompletos()` — a ficha não decide sozinha o que é importante. */
  falta?: boolean
}) {
  const editavel = edit && campo != null && rascunho != null && onChange != null
  // Enquanto edita, o destaque acompanha o que a pessoa digitou: preencher o campo
  // apaga o âmbar na hora, sem esperar o salvamento. `falta` vem do dado gravado e
  // sozinho manteria o alerta aceso sobre um campo já preenchido na tela.
  const aindaFalta = falta && (!editavel || !String((rascunho?.[campo!] as string | undefined) ?? '').trim())
  const marca = aindaFalta ? ' campo-falta' : ''
  // Em leitura, campos de data saem em dd/mm/aaaa; o <input type="date"> segue
  // exigindo o ISO cru e por isso a conversão fica só na exibição.
  const bruto = valor === null || valor === undefined || valor === '' ? '—' : String(valor)
  const texto = tipo === 'date' ? (dataBR(bruto) || bruto) : bruto

  if (editavel) {
    const val = (rascunho[campo] as string | undefined) ?? ''
    const set = (v: string) => onChange(campo, v)
    return (
      <div style={{ gridColumn: `span ${span}` }} className={marca.trim() || undefined}>
        <div className="uppercase t-muted campo-lbl" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>
          {label}
        </div>
        {opcoes ? (
          <select className="bm-input" value={val} onChange={(e) => set(e.target.value)}>
            <option value="">—</option>
            {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : multiline ? (
          <textarea
            className="bm-input" rows={3} value={val} onChange={(e) => set(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        ) : (
          <input
            type={tipo} className={`bm-input${mono ? ' mono' : ''}`} value={val}
            onChange={(e) => set(e.target.value)}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ gridColumn: `span ${span}` }} className={marca.trim() || undefined}>
      <div className="uppercase t-muted campo-lbl" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>
        {label}
      </div>
      <div
        className={`campo-box${mono ? ' mono' : ''}`}
        title={aindaFalta ? `${label} não veio no censo. Use “Editar” para informar.` : undefined}
        style={{
          // Borda e fundo ficam no inline (e não na classe .campo-falta) porque
          // estilo inline vence a folha: deixá-los só no CSS faria o âmbar nunca
          // aparecer. A classe segue existindo para o rótulo e para o modo edição.
          border: `1px solid ${aindaFalta ? 'var(--warning)' : 'var(--border-strong)'}`,
          borderRadius: 8,
          padding: multiline ? '9px 11px' : '7px 11px',
          minHeight: multiline ? 60 : undefined,
          fontSize: 'var(--t-base)',
          color: aindaFalta ? 'var(--warning-2)' : texto === '—' ? 'var(--muted-2)' : 'var(--ink)',
          background: aindaFalta ? 'var(--warning-bg)' : 'var(--surface)',
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {texto}
      </div>
    </div>
  )
}

// Um relatório no card lateral: quando/quem registrou + a observação escrita.
// Mostra a data-hora de registro (criado_em), o autor com o chip de papel e a
// descrição, no mesmo formato da timeline.
function RelatorioCard({ r }: { r: RelatorioItem }) {
  const cor = roleVisual(r.autor_role).color

  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px',
        borderLeft: `3px solid ${cor}`, background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--ink)' }}>
          {dataHora(r.criado_em) || dataBR(r.data_visita) || '—'}
        </span>
        {r.autor && <AutorChip role={r.autor_role} autor={r.autor} />}
      </div>
      {r.data_visita && (
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)', marginTop: 2 }}>
          Visita: {dataBR(r.data_visita)}{r.medico ? ` · ${r.medico}` : ''}
        </div>
      )}
      {r.descricao && (
        <div className="tl-desc" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
          {r.descricao}
        </div>
      )}
    </div>
  )
}

function LeitoBig({ tipo }: { tipo?: string | null }) {
  if (tipo === 'UTI') return <span className="leito UTI" style={{ fontSize: 13, padding: '4px 10px' }}>UTI</span>
  if (tipo === 'APARTAMENTO') return <span className="leito APARTAMENTO" style={{ fontSize: 13, padding: '4px 10px' }}>APT</span>
  if (tipo === 'ENFERMARIA') return <span className="leito ENFERMARIA" style={{ fontSize: 13, padding: '4px 10px' }}>ENF</span>
  return <span style={{ fontSize: 'var(--t-md)', color: 'var(--muted-2)' }}>—</span>
}

function TimelineItem({ ev }: { ev: TimelineEvento }) {
  const relatorio = isRelatorio(ev)
  // Classe de cor do tipo. Tipos conhecidos viram card colorido; um tipo sem
  // mapeamento (evento legado) fica em linha simples com a variante do backend.
  const tipoClasse = classeDoEvento(ev)
  const cardClass = tipoClasse ? ` tl-card ${tipoClasse}` : ''
  // Marcador: a classe de tipo colore o dot; sem tipo mapeado, usa a variante.
  const dotClass = tipoClasse || ev.variante
  const visita = ev.tipo === 'VISITA_AGENDADA'
  const cancelada = visita && ev.status_visita === 'cancelada'
  return (
    <div className={`tl-item${cardClass}${cancelada ? ' tl-cancelada' : ''}`}>
      {/* Cancelada troca o marcador redondo por um X: o card já muda de cor
          (cinza), mas o X torna o estado "não vai mais acontecer" legível
          mesmo sem olhar a cor — a mesma informação que "Longa avançada"
          removida do Kanban tinha (ver bmais-kanban-priorizacao-card): o texto
          não pode depender só da cor para se explicar. */}
      {cancelada ? (
        <span className="tl-dot-x" aria-hidden>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </span>
      ) : (
        <div className={`tl-dot ${dotClass}`} />
      )}
      <div className="tl-date">
        {ev.hoje ? 'Hoje' : dataBR(ev.data) || '—'}
        {/* Hora só em VISITA_AGENDADA (migration 0035) — os demais tipos não
            têm hora registrada, e um "—" gratuito seria ruído. */}
        {visita && ev.hora && <span className="tl-hora"> às {ev.hora.slice(0, 5)}</span>}
      </div>
      <div className="tl-label">
        <span className={cancelada ? 'tl-label-riscado' : undefined}>{ev.titulo}</span>
        {/* Relatório externo: médico responsável. Relatório interno: quem o fez
            (autor/e-mail por enquanto). Cor do chip pelo papel de quem registrou. */}
        {relatorio && ev.tipo === 'RELATORIO_INTERNO' && ev.autor && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.autor} role={ev.autor_role} titulo="Autor" />
          </span>
        )}
        {relatorio && ev.tipo !== 'RELATORIO_INTERNO' && ev.medico && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.medico} role={ev.autor_role} />
          </span>
        )}
        {/* Visita agendada: mesmo chip do relatório, de QUEM é o compromisso —
            não confundir com "quem clicou em agendar" (autor), que não aparece
            aqui de propósito, igual a Admissão não mostra quem cadastrou.
            Continua aparecendo cancelada: "de quem era" a visita que não
            aconteceu é útil tanto quanto "de quem é" a que ainda vai. */}
        {visita && ev.medico && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <MedicoChip nome={ev.medico} role={ev.autor_role} titulo="Responsável" />
          </span>
        )}
      </div>
      {ev.descricao && <div className="tl-desc">{ev.descricao}</div>}
    </div>
  )
}
