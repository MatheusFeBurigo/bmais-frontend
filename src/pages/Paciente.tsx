// Tela de detalhe (ficha completa) de uma internação — reproduz a página
// /paciente/{id} do app legado (bmais-auditoria). Aberta a partir do botão
// "Ver relatório completo" no PacienteDrawer.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import { StatusBadge, AutorChip, roleVisual } from '../components/StatusBadge'
import Toast from '../components/Toast'
import { LoadingState, Spinner } from '../components/ui'
import { useEditarInternacao, useInternacaoDados, useInternacaoTimeline } from '../hooks/useInternacao'
import type { InternacaoEdicao } from '../services/internacao.service'
import type { InternacaoDados, TimelineEvento } from '../types/api'

export default function Paciente() {
  const { id } = useParams<{ id: string }>()
  const internacaoId = Number(id)
  const navigate = useNavigate()

  const idInvalido = !id || Number.isNaN(internacaoId)
  const { data: d, isLoading, isError } = useInternacaoDados(internacaoId)
  const { data: tl, isLoading: tlLoading, isError: tlError } = useInternacaoTimeline(internacaoId)
  const editar = useEditarInternacao(internacaoId)

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
      data_entrada: d.data_entrada ?? '',
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
      const res = await editar.mutateAsync(rascunho)
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

  const sr = d?.status_relatorio || ''

  // Topbar da página: título com o nome + subtítulo com atendimento/hospital,
  // e ação "Voltar" à direita. Publicado no header persistente do AppLayout.
  usePageHeader(
    useMemo(
      () => ({
        title: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {d?.nome || (isLoading ? '—' : 'Paciente')}
            {sr && <StatusBadge sr={sr} />}
          </span>
        ),
        subtitle: d ? (
          <>
            Atend. <span className="mono">{d.atendimento || '—'}</span> · {d.hospital_nome || '—'}
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
            {d.data_ultima_visita || 'Sem rel.'}
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

      {/* ── Grid: dados à esquerda, relatórios/timeline à direita ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 16, alignItems: 'start' }}>
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
              <Campo label="Nome do segurado" valor={d.nome} span={2} edit={editando} campo="nome" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Status" valor={d.status || 'INTERNADO'} edit={editando} campo="status" rascunho={rascunho} onChange={setCampo} opcoes={STATUS_OPCOES} />
              <Campo label="RN" valor={rnLabel(d)} />

              <Campo label="Atendimento" valor={d.atendimento} mono edit={editando} campo="atendimento" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Tipo de leito" valor={d.tipo_leito} edit={editando} campo="tipo_leito" rascunho={rascunho} onChange={setCampo} opcoes={LEITO_OPCOES} />
              <Campo label="Leito / código" valor={d.leito_codigo} edit={editando} campo="leito_codigo" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Data internação" valor={d.data_entrada} mono edit={editando} campo="data_entrada" rascunho={rascunho} onChange={setCampo} tipo="date" />

              <Campo label="Data alta" valor={d.status === 'INTERNADO' || !d.data_ultima_visita ? 'PERMANECE' : '—'} />
              <Campo label="Médico" valor={d.medico} edit={editando} campo="medico" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Especialidade" valor={d.especialidade} span={2} edit={editando} campo="especialidade" rascunho={rascunho} onChange={setCampo} />

              <Campo label="Diagnóstico" valor={d.diagnostico} span={4} edit={editando} campo="diagnostico" rascunho={rascunho} onChange={setCampo} />
              <Campo label="Observações" valor={d.obs} span={4} multiline edit={editando} campo="obs" rascunho={rascunho} onChange={setCampo} />
            </div>
          </div>
        </div>

        {/* Relatórios + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Relatórios</div>
              <span className="badge muted">{contarRelatorios(tl?.eventos)}</span>
            </div>
            <div className="card-body">
              {tl && contarRelatorios(tl.eventos) === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted-2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--muted)' }}>Nenhum relatório</div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>Registre o primeiro no drawer.</div>
                </div>
              ) : (
                <>
                  <div className="tl">
                    {tl?.eventos.filter(isRelatorio).map((ev, i) => (
                      <TimelineItem key={i} ev={ev} />
                    ))}
                  </div>
                  <LegendaPapeis />
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Timeline</div>
              <span className="badge muted">{tl?.eventos.length ?? 0}</span>
            </div>
            <div className="card-body">
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
            </div>
          </div>
        </div>
      </div>

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

function isRelatorio(ev: TimelineEvento): boolean {
  return ev.tipo === 'relatorio' || /relat[óo]rio/i.test(ev.titulo)
}

function contarRelatorios(eventos?: TimelineEvento[]): number {
  return eventos ? eventos.filter(isRelatorio).length : 0
}

function Campo({
  label, valor, span = 1, mono = false, multiline = false,
  edit = false, campo, rascunho, onChange, opcoes, tipo = 'text',
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
}) {
  const editavel = edit && campo != null && rascunho != null && onChange != null
  const texto = valor === null || valor === undefined || valor === '' ? '—' : String(valor)

  if (editavel) {
    const val = (rascunho[campo] as string | undefined) ?? ''
    const set = (v: string) => onChange(campo, v)
    return (
      <div style={{ gridColumn: `span ${span}` }}>
        <div className="uppercase t-muted" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>
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
    <div style={{ gridColumn: `span ${span}` }}>
      <div className="uppercase t-muted" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>
        {label}
      </div>
      <div
        className={mono ? 'mono' : undefined}
        style={{
          border: '1px solid var(--border-strong)',
          borderRadius: 8,
          padding: multiline ? '9px 11px' : '7px 11px',
          minHeight: multiline ? 60 : undefined,
          fontSize: 'var(--t-base)',
          color: texto === '—' ? 'var(--muted-2)' : 'var(--ink)',
          background: 'var(--surface)',
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

// Legenda do código de cores: cada papel de auditor tem uma cor no marcador do
// relatório. Ajuda o usuário a ler a timeline de quem registrou o quê.
function LegendaPapeis() {
  const papeis: Array<'admin' | 'diretor' | 'gestor' | 'analista'> = ['admin', 'diretor', 'gestor', 'analista']
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      {papeis.map((p) => {
        const v = roleVisual(p)
        return (
          <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
            {v.label}
          </span>
        )
      })}
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
  const labelStyle = ev.variante === 'danger' ? { color: 'var(--danger)' } : undefined
  // Relatório: o marcador ganha a cor do papel de quem registrou (não a variante
  // genérica). Demais eventos mantêm a variante padrão.
  const dotStyle = relatorio ? { background: roleVisual(ev.autor_role).color } : undefined
  return (
    <div className="tl-item">
      <div className={`tl-dot ${ev.variante}`} style={dotStyle} />
      <div className="tl-date">{ev.hoje ? 'Hoje' : ev.data || '—'}</div>
      <div className="tl-label" style={labelStyle}>
        {ev.titulo}
        {relatorio && (
          <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
            <AutorChip role={ev.autor_role} autor={ev.autor} />
          </span>
        )}
      </div>
      {ev.descricao && <div className="tl-desc">{ev.descricao}</div>}
    </div>
  )
}
