// Réplicas das telas de Operação, usadas nos "como fazer" da Ajuda.
//
// Sempre que a tela real é montada por um componente puro, a réplica usa ESSE
// componente com dados fictícios (StatusBadge, KanbanCard, KanbanFiltros,
// FormularioEnvio, ResultadoEnvio, ListaPacientes, Alerta). O que é página com
// busca de dados embutida (a tabela do painel, o drawer) é redesenhado aqui com
// as mesmas classes do design-system. Mudou a tela? Confira a réplica.
//
// Os nomes são inventados: nenhum dado real de paciente entra na documentação.
import { useMemo, type ReactNode } from 'react'
import type {
  Hospital, KanbanTarefa, Operadora, PacienteGravado, UploadCensoResult,
} from '../../types/api'
import { StatusBadge, LeitoTag, rowFlagClass, MedicoChip, AutorChip } from '../StatusBadge'
import { OpAvatar } from '../ui'
import { DiasRatio } from '../internados/cells'
import { KanbanCard } from '../kanban/KanbanCard'
import { KanbanFiltros } from '../kanban/KanbanFiltros'
import { localStyles as kanbanStyles } from '../kanban/kanban.styles'
import { COLUNAS } from '../kanban/colunas'
import { contarChips } from '../kanban/prioridade'
import { FormularioEnvio, formularioStyles } from '../upload/FormularioEnvio'
import { ResultadoEnvio, estilosResultado } from '../upload/ResultadoEnvio'
import { ListaPacientes } from '../upload/ListaPacientes'
import { Alerta, alertaStyles } from '../Alerta'
import { Alvo, ModalReplica } from './replica'

const nada = () => {}

/** Envolve `node` num <Alvo> quando a marca foi pedida; senão devolve como está. */
function marcar(n: number | undefined, node: ReactNode, bloco = false) {
  return n ? <Alvo n={n} bloco={bloco}>{node}</Alvo> : node
}

/** Cabeçalho de página (o `.topbar` real é sticky e ocupa a largura do app). */
export function Topo({ titulo, sub, acoes }: { titulo: string; sub?: string; acoes?: ReactNode }) {
  return (
    <div className="topbar" style={{
      position: 'static', margin: '0 0 16px', padding: '10px 16px', minHeight: 0,
      border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
    }}>
      <div className="tb-title">
        <div style={{ fontSize: 'var(--t-lg)', fontWeight: 600, letterSpacing: '-.01em', color: 'var(--ink)' }}>{titulo}</div>
        {sub && <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <div className="tb-spacer" />
      {acoes}
    </div>
  )
}

const IcoMais = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
)

// ── Painel Operacional ────────────────────────────────────────────────────────

interface LinhaPainel {
  id: number
  sr: string
  op: string
  opNome: string
  hospital: string
  nome: string
  atend: string
  leito: string
  entrada: string
  ultima: string | null
  semRel: number
  janela: number
  dias: number
  gatilho: number
  longa10?: boolean
  longa30?: boolean
}

const LINHAS_PAINEL: LinhaPainel[] = [
  { id: 1, sr: 'SEM_RELATORIO', op: 'careplus', opNome: 'CarePlus', hospital: 'Hospital Santa Clara',
    nome: 'Ana Beatriz Moura', atend: '771204', leito: 'UTI', entrada: '09/09/2026', ultima: null,
    semRel: 16, janela: 7, dias: 16, gatilho: 10, longa10: true },
  { id: 2, sr: 'VENCIDO', op: 'porto', opNome: 'Porto Seguro', hospital: 'Hospital São Lucas',
    nome: 'Carlos Eduardo Lima', atend: '552318', leito: 'APARTAMENTO', entrada: '12/09/2026', ultima: '15/09/2026',
    semRel: 10, janela: 7, dias: 13, gatilho: 10, longa10: true },
  { id: 3, sr: 'PROXIMO_VENCER', op: 'careplus', opNome: 'CarePlus', hospital: 'Hospital Santa Clara',
    nome: 'Helena Duarte', atend: '771388', leito: 'ENFERMARIA', entrada: '18/09/2026', ultima: '20/09/2026',
    semRel: 5, janela: 7, dias: 7, gatilho: 10 },
  { id: 4, sr: 'EM_DIA', op: 'sulamerica', opNome: 'SulAmérica', hospital: 'Hospital Vila Nova',
    nome: 'Roberto Nunes', atend: '190547', leito: 'APARTAMENTO', entrada: '21/09/2026', ultima: '24/09/2026',
    semRel: 1, janela: 7, dias: 4, gatilho: 10 },
]

type MarcaPainel = 'operadora' | 'kpi' | 'hospital' | 'filtros' | 'busca' | 'linha' | 'hospitalLink'
  | 'exportar' | 'adicionar'

/** O Painel Operacional como ele abre: operadora, cartões, filtros e a lista. */
export function ReplicaPainel({ marcas = {}, kpiAtivo, uti }: {
  marcas?: Partial<Record<MarcaPainel, number>>
  /** Cartão já clicado (filtro ligado). */
  kpiAtivo?: 'sem_relatorio' | 'vencido' | 'proximo' | 'em_dia'
  /** Chip "UTI / CTI" ligado. */
  uti?: boolean
}) {
  const kpis: Array<[string, number, string, string, string]> = [
    ['sem_relatorio', 12, 'danger', 'Sem Relatório', 'nunca registrado'],
    ['vencido', 8, 'warning', 'Atrasado', 'passou da janela'],
    ['proximo', 5, 'caution', 'Próx. Vencer', 'vence em 1–3 dias'],
    ['em_dia', 61, 'success', 'Em Dia', 'sem relatório devido'],
    ['todos', 86, 'neutral', 'Total Ativos', '31 em monitoramento'],
  ]
  const filtroKpi = kpiAtivo === 'sem_relatorio' ? 'SEM_RELATORIO'
    : kpiAtivo === 'vencido' ? 'VENCIDO'
      : kpiAtivo === 'proximo' ? 'PROXIMO_VENCER'
        : kpiAtivo === 'em_dia' ? 'EM_DIA' : null
  const linhas = LINHAS_PAINEL
    .filter((l) => !filtroKpi || l.sr === filtroKpi)
    .filter((l) => !uti || l.leito === 'UTI')

  const gradeKpis = (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
      {kpis.map(([k, v, cls, lbl, meta]) => (
        <div key={k} className={`kpi ${cls} kpi-clickable${kpiAtivo === k ? ' active-filter' : ''}`}>
          <div className="kpi-bar" />
          <div className="kpi-label">{lbl}</div>
          <div className="kpi-value">{v}</div>
          <div className="kpi-meta">{meta}</div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Topo titulo="Painel Operacional" sub="Todas as operadoras · 86 internados · Ref: 25/09/2026"
        acoes={<button className="btn btn-outline btn-sm">Atualizar</button>} />

      {marcar(marcas.operadora, (
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="op-av todas" style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </span>
          <select className="bm-input bm-select" style={{ width: 'auto', minWidth: 220 }} value="" onChange={nada}>
            <option value="">Todas as operadoras</option>
          </select>
        </div>
      ))}

      <div className="section-label">Controle de Relatórios de Auditoria</div>
      {marcar(marcas.kpi, gradeKpis, true)}

      <div className="section-label" style={{ marginTop: 18 }}>Hospital: 14 unidades cadastradas em 3 operadoras</div>
      {marcar(marcas.hospital, (
        <select className="bm-input bm-select" style={{ width: 380 }} value="" onChange={nada}>
          <option value="">Todos os hospitais (86 internados)</option>
        </select>
      ))}

      <div className="quick-filters" style={{ marginTop: 14 }}>
        {marcar(marcas.filtros, (
          <span className="row" style={{ gap: 8 }}>
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>Filtros rápidos:</span>
            <span className={`qf-chip${uti ? ' active' : ''}`}>UTI / CTI</span>
            <span className="qf-chip">Longa 10d+</span>
            <span className="qf-chip">Longa 30d+</span>
            <span className="qf-chip">&gt; 30 dias</span>
            <span className="qf-chip">Altas</span>
          </span>
        ))}
        <div style={{ flex: 1 }} />
        {marcar(marcas.busca, (
          <input type="text" className="bm-input" style={{ width: 220 }} readOnly
            placeholder="Buscar segurado, atendimento…" />
        ))}
      </div>

      <div className="card" style={{ marginTop: 14, overflow: 'visible' }}>
        <div className="card-header" style={{ alignItems: 'center', paddingBottom: 14 }}>
          <div>
            <div className="card-title">Todos os Internados</div>
            <div className="card-sub">
              <span className="mono fw-6">{linhas.length}</span> de <span className="mono fw-6">86</span>
              <span className="dot-sep" />Clique na linha para detalhes
            </div>
          </div>
          <div className="row" style={{ gap: 12 }}>
            {marcar(marcas.exportar, <button className="btn btn-outline btn-sm">Exportar</button>)}
            {marcar(marcas.adicionar, (
              <button className="btn btn-primary btn-sm" style={{ gap: 6 }}>{IcoMais}Adicionar paciente</button>
            ))}
          </div>
        </div>
        <table className="bmais-table">
          <thead>
            <tr>
              <th style={{ width: 104 }}>Relatório</th>
              <th style={{ width: 118 }}>Operadora</th>
              <th>Hospital</th>
              <th>Segurado</th>
              <th style={{ width: 56 }}>Leito</th>
              <th>Última Visita</th>
              <th className="t-right" style={{ width: 92 }}>Sem relatório</th>
              <th className="t-right" style={{ width: 84 }}>Dias internado</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const primeira = i === 0
              const tomSemRel = l.sr === 'SEM_RELATORIO' ? 'danger' : l.sr === 'VENCIDO' ? 'warning' : 'neutral'
              return (
                <tr key={l.id} className={rowFlagClass(l.sr)}>
                  <td>{marcar(primeira ? marcas.linha : undefined, <StatusBadge sr={l.sr} />)}</td>
                  <td>
                    <span className="row" style={{ gap: 6 }}>
                      <OpAvatar opKey={l.op} size={18} />
                      <span className="truncate" style={{ fontSize: 'var(--t-sm)' }}>{l.opNome}</span>
                    </span>
                  </td>
                  <td>
                    {marcar(primeira ? marcas.hospitalLink : undefined, (
                      <span className="link-cell" style={{ fontSize: 'var(--t-sm)', whiteSpace: 'nowrap' }}>{l.hospital}</span>
                    ))}
                  </td>
                  <td><div className="fw-5" style={{ whiteSpace: 'nowrap' }}>{l.nome}</div></td>
                  <td><LeitoTag tipo={l.leito} /></td>
                  <td><span className="mono" style={{ fontSize: 'var(--t-sm)' }}>{l.ultima || '—'}</span></td>
                  <td className="t-right"><DiasRatio value={l.semRel} limit={l.janela} tone={tomSemRel} /></td>
                  <td className="t-right">
                    <DiasRatio value={l.dias} limit={l.gatilho} tone={l.longa30 ? 'danger' : l.longa10 ? 'warning' : 'neutral'} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Ficha rápida (drawer) ─────────────────────────────────────────────────────

type MarcaFicha = 'cabecalho' | 'hospital' | 'detalhes' | 'indicadores' | 'timeline'
  | 'dataVisita' | 'medico' | 'obs' | 'registrar'
  | 'agendaData' | 'agendaHora' | 'agendaMedico' | 'agendar' | 'agendaResumo' | 'cancelar'

/** O painel lateral que abre ao clicar num paciente. `agendada` mostra o estado
 *  depois de marcar a visita (o bloco vira um resumo com "Cancelar"). */
export function ReplicaFichaRapida({ marcas = {}, agendada, atrasada, preenchido, esconderRelatorio, esconderAgenda }: {
  marcas?: Partial<Record<MarcaFicha, number>>
  agendada?: boolean
  /** Visita marcada cujo horário já passou sem relatório. */
  atrasada?: boolean
  /** Formulário já preenchido, como fica logo antes de clicar no botão. */
  preenchido?: boolean
  esconderRelatorio?: boolean
  esconderAgenda?: boolean
}) {
  // Futura, a visita fica acima de "Hoje"; atrasada, abaixo: a timeline vai do
  // mais recente para o mais antigo, como na tela.
  const visitaNaTimeline = (
    <div className="tl-item tl-card tp-visita-agendada">
      <div className="tl-dot tp-visita-agendada" />
      <div className="tl-date">{atrasada ? '24/09/2026' : '26/09/2026'}<span className="tl-hora"> às {atrasada ? '10:30' : '14:00'}</span></div>
      <div className="tl-label">Visita agendada
        <span style={{ marginLeft: 8 }}><MedicoChip nome={atrasada ? 'Dra. Renata Alves' : 'Dr. Paulo Mendes'} role="tecnico" titulo="Responsável" /></span>
      </div>
    </div>
  )

  return (
    <div className="aj-drawer-palco">
      <div className="aj-drawer-fundo" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ width: `${55 + ((i * 17) % 40)}%` }} />)}
      </div>
      <div className="aj-drawer">
        <div className="aj-drawer-head">
          {marcar(marcas.cabecalho, <StatusBadge sr="SEM_RELATORIO" />)}
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-lg)', fontWeight: 600, letterSpacing: '-.01em' }}>Ana Beatriz Moura</div>
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
              Atend. <span className="mono">771204</span> ·{' '}
              {marcar(marcas.hospital, <span className="link-cell">Hospital Santa Clara</span>)}
            </div>
          </div>
          {marcar(marcas.detalhes, (
            <span className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              Detalhes
            </span>
          ))}
          <span className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </span>
        </div>

        <div className="aj-drawer-body">
          {marcar(marcas.indicadores, (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <div className="dk">
                <div className="dk-label">Dias internado</div>
                <div className="dk-value">16</div>
                <div className="dk-meta">desde 09/09/2026</div>
              </div>
              <div className="dk" style={{ background: 'var(--danger-bg)', borderColor: 'rgba(200,36,60,.2)' }}>
                <div className="dk-bar" style={{ background: 'var(--danger)' }} />
                <div className="dk-label" style={{ color: 'var(--danger)' }}>Sem relatório</div>
                <div className="dk-value" style={{ color: 'var(--danger)' }}>16d</div>
                <div className="dk-meta">Janela: 7d</div>
              </div>
              <div className="dk">
                <div className="dk-label">Leito</div>
                <div style={{ marginTop: 6 }}><LeitoTag tipo="UTI" /></div>
                <div className="dk-meta">Gatilho: 10d</div>
              </div>
            </div>
          ), true)}

          <div className="section-label" style={{ margin: '20px 0 12px' }}>Timeline da internação</div>
          {marcar(marcas.timeline, (
            <div className="tl">
              {agendada && !atrasada && visitaNaTimeline}
              <div className="tl-item">
                <div className="tl-dot neutral" />
                <div className="tl-date">Hoje</div>
                <div className="tl-label">16 dias internado, sem relatório</div>
              </div>
              {atrasada && visitaNaTimeline}
              <div className="tl-item tl-card tp-edit">
                <div className="tl-dot tp-edit" />
                <div className="tl-date">11/09/2026</div>
                <div className="tl-label">Leito corrigido
                  <span style={{ marginLeft: 8 }}><AutorChip role="administrativo" autor="marina" /></span>
                </div>
              </div>
              <div className="tl-item tl-card tp-admissao">
                <div className="tl-dot tp-admissao" />
                <div className="tl-date">09/09/2026</div>
                <div className="tl-label">Admissão</div>
                <div className="tl-desc">Entrou pelo censo do Hospital Santa Clara</div>
              </div>
            </div>
          ), true)}

          {!esconderRelatorio && (
            <>
              <div className="section-label" style={{ marginTop: 20 }}>Registrar relatório</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {marcar(marcas.dataVisita, (
                  <div>
                    <div className="aj-campo-lbl">Data da visita realizada *</div>
                    <input className="bm-input" readOnly value={preenchido ? '25/09/2026' : ''} placeholder="Escolher data" />
                  </div>
                ), true)}
                {marcar(marcas.medico, (
                  <div>
                    <div className="aj-campo-lbl">Médico auditor</div>
                    <input className="bm-input" readOnly value={preenchido ? 'Dr. Paulo Mendes' : ''} placeholder="Buscar médico…" />
                  </div>
                ), true)}
              </div>
              <div style={{ marginTop: 10 }}>
                {marcar(marcas.obs, (
                  <div style={{ width: '100%' }}>
                    <div className="aj-campo-lbl">Observação</div>
                    <textarea className="bm-input" rows={2} readOnly style={{ resize: 'none', fontFamily: 'inherit' }}
                      placeholder="Observações técnicas do auditor…"
                      value={preenchido ? 'Paciente estável, previsão de alta da UTI em 48h.' : ''} />
                  </div>
                ), true)}
              </div>
              <div style={{ marginTop: 10 }}>
                {marcar(marcas.registrar, <span className="btn btn-outline">Registrar relatório</span>)}
              </div>
            </>
          )}

          {!esconderAgenda && (
            <>
              <div className="section-label" style={{ marginTop: 20 }}>Agendar visita</div>
              {agendada || atrasada ? (
                <div className="dk" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {marcar(marcas.agendaResumo, (
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--t-md)', color: atrasada ? 'var(--danger)' : 'var(--ink-2)' }}>
                        {atrasada ? 'Visita atrasada, era 24/09/2026 às 10:30' : 'Visita marcada para 26/09/2026 às 14:00'}
                      </div>
                      <div className="dk-meta">Responsável: {atrasada ? 'Dra. Renata Alves' : 'Dr. Paulo Mendes'}</div>
                    </div>
                  ))}
                  <div className="flex-1" />
                  {marcar(marcas.cancelar, <span className="btn btn-outline btn-sm">Cancelar</span>)}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {marcar(marcas.agendaData, (
                      <div style={{ flex: 1 }}>
                        <div className="aj-campo-lbl">Data da visita</div>
                        <input className="bm-input" readOnly value={preenchido ? '26/09/2026' : ''} placeholder="Escolher data" />
                      </div>
                    ), true)}
                    <div style={{ width: 110 }}>
                      {marcar(marcas.agendaHora, (
                        <div style={{ width: '100%' }}>
                          <div className="aj-campo-lbl">Horário</div>
                          <input className="bm-input" readOnly value={preenchido ? '14:00' : ''} placeholder="--:--" />
                        </div>
                      ), true)}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {marcar(marcas.agendaMedico, (
                      <div>
                        <div className="aj-campo-lbl">Médico responsável</div>
                        <input className="bm-input" readOnly value={preenchido ? 'Dr. Paulo Mendes' : ''} placeholder="Buscar médico…" />
                      </div>
                    ), true)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {marcar(marcas.agendar, <span className="btn btn-outline">Agendar visita</span>)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ficha completa (página do paciente) ──────────────────────────────────────

/** O card "Dados do paciente" da ficha completa, em leitura ou em edição. */
export function ReplicaDadosPaciente({ marcas = {}, editando }: {
  marcas?: Partial<Record<'aviso' | 'editar' | 'campo' | 'salvar', number>>
  editando?: boolean
}) {
  const campo = (rotulo: string, valor: string, opts: { span?: number; falta?: boolean; mono?: boolean } = {}) => {
    const { span = 1, falta, mono } = opts
    return (
      <div style={{ gridColumn: `span ${span}` }}>
        <div className="uppercase t-muted" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>{rotulo}</div>
        {editando ? (
          <input className={`bm-input${mono ? ' mono' : ''}`} readOnly value={valor === '—' ? '' : valor} />
        ) : (
          <div className={mono ? 'mono' : undefined} style={{
            border: `1px solid ${falta ? 'var(--warning)' : 'var(--border-strong)'}`, borderRadius: 8,
            padding: '7px 11px', fontSize: 'var(--t-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: falta ? 'var(--warning-2)' : valor === '—' ? 'var(--muted-2)' : 'var(--ink)',
            background: falta ? 'var(--warning-bg)' : 'var(--surface)',
          }}>{valor}</div>
        )}
      </div>
    )
  }
  return (
    <>
      <style>{alertaStyles}</style>
      {!editando && marcar(marcas.aviso, (
        <div style={{ marginBottom: 14 }}>
          <Alerta nivel="atencao"><b>Leito / código</b> não veio no censo. Sem ele, a visita não sabe onde encontrar o paciente.</Alerta>
        </div>
      ), true)}
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Dados do Paciente</div>
            <div className="card-sub">Internação ativa</div>
          </div>
          {editando ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="btn btn-outline btn-sm">Cancelar</span>
              {marcar(marcas.salvar, <span className="btn btn-primary btn-sm">Salvar</span>)}
            </div>
          ) : marcar(marcas.editar, (
            <span className="btn btn-outline btn-sm" style={{ gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Editar
            </span>
          ))}
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {campo('Nome do segurado', 'Ana Beatriz Moura', { span: 2 })}
            {campo('Senha de autorização', '88213409', { mono: true })}
            {campo('Status', 'INTERNADO')}
            {campo('Atendimento', '771204', { mono: true })}
            {campo('Carteirinha', '0 042 881203 00 7', { mono: true })}
            {campo('Tipo de leito', 'UTI')}
            {marcar(marcas.campo, campo('Leito / código', editando ? 'UTI-04' : '—', { falta: !editando }), true)}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Quadro de Tarefas ─────────────────────────────────────────────────────────

const TAREFAS: KanbanTarefa[] = [
  { id: 't1', coluna: 'sem_relatorio', titulo: 'ANA BEATRIZ MOURA', hospital_nome: 'Hospital Santa Clara',
    operadora_key: 'careplus', internacao_id: 1, dias_sem_relatorio: 16, tipo_leito: 'UTI', leito_codigo: 'UTI-04',
    longa_10: true, limite_longa: 10, data_ultima_visita: null, atendimento: '771204', dias: 16,
    data_entrada: '2026-09-09', convenio: 'CAREPLUS EXECUTIVO', medico: 'Dra. Renata Alves' },
  { id: 't2', coluna: 'sem_relatorio', titulo: 'HELENA DUARTE', hospital_nome: 'Hospital Vila Nova',
    operadora_key: 'sulamerica', internacao_id: 3, dias_sem_relatorio: 5, tipo_leito: 'ENFERMARIA',
    leito_codigo: '312B', data_ultima_visita: '2026-09-20', atendimento: '190511', dias: 7 },
  { id: 't3', coluna: 'aguardando_visita', titulo: 'CARLOS EDUARDO LIMA', hospital_nome: 'Hospital São Lucas',
    operadora_key: 'porto', internacao_id: 2, dias_sem_relatorio: 10, tipo_leito: 'APARTAMENTO', leito_codigo: '507',
    data_ultima_visita: '2026-09-15', visita_agendada: true, visita_agendada_em: '2026-09-26',
    visita_agendada_hora: '14:00', visita_agendada_medico: 'Dr. Paulo Mendes' },
  { id: 't4', coluna: 'visitas_atrasadas', titulo: 'JOSÉ ROBERTO FARIAS', hospital_nome: 'Hospital Santa Clara',
    operadora_key: 'careplus', internacao_id: 5, dias_sem_relatorio: 9, tipo_leito: 'APARTAMENTO', leito_codigo: '221',
    data_ultima_visita: '2026-09-16', visita_agendada: true, visita_agendada_vencida: true,
    visita_agendada_em: '2026-09-24', visita_agendada_hora: '10:30', visita_agendada_medico: 'Dra. Renata Alves' },
]

const TAREFA_COBRANCA: KanbanTarefa = {
  id: 'c1', coluna: 'cobrancas', titulo: 'HOSPITAL SÃO LUCAS', operadora_key: 'porto', cobranca_id: 1,
  data_ref: '2026-09-24', ultimo_censo: '2026-09-21', dias_sem_censo: 4,
}

const HOSPITAIS_FILTRO = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara' },
  { key: 'sao_lucas', nome: 'Hospital São Lucas' },
  { key: 'vila_nova', nome: 'Hospital Vila Nova' },
]

/** O quadro do perfil técnico (três colunas de pacientes), com a barra de filtros.
 *  `marcas.card` marca o 1º card de "Sem relatório"; `aguardando` e `atrasada`,
 *  a coluna ou o card correspondentes. */
export function ReplicaQuadro({ marcas = {}, chipsAtivos = [] }: {
  marcas?: Partial<Record<'filtros' | 'card' | 'aguardando' | 'atrasada', number>>
  chipsAtivos?: Array<'urgente' | 'uti' | 'longa' | 'nunca_visitado'>
}) {
  const colunas = COLUNAS.filter((c) => c.key !== 'cobrancas')
  const contagens = useMemo(() => contarChips(TAREFAS), [])
  return (
    <>
      <style>{kanbanStyles}</style>
      <Topo titulo="Tarefas" sub="4 tarefas pendentes" />
      {marcar(marcas.filtros, (
        <KanbanFiltros
          recorte={{ busca: '', chips: chipsAtivos, hospital: '', ordem: 'prioridade' }}
          onChange={nada} contagens={contagens} hospitais={HOSPITAIS_FILTRO}
          totalVisivel={TAREFAS.length} totalGeral={TAREFAS.length}
        />
      ), true)}
      <div className="kb-board" style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(240px, 1fr))`, overflow: 'visible' }}>
        {colunas.map((col) => {
          const itens = TAREFAS.filter((t) => t.coluna === col.key)
          const coluna = (
            <section className="kb-col" style={{ ['--kb-cor' as string]: col.cor }}>
              <header className="kb-col-head">
                <div className="kb-col-title-row">
                  <span className="kb-col-title">{col.titulo}</span>
                  <span className="kb-col-count">{itens.length}</span>
                </div>
                <div className="kb-col-desc">{col.descricao}</div>
              </header>
              <div className="kb-col-body">
                {itens.map((t, i) => {
                  const card = (
                    <KanbanCard tarefa={t} corBg={col.corBg} onAbrir={nada} onPrefetch={nada}
                      onCobrar={nada} cobrando={false} />
                  )
                  const n = col.key === 'sem_relatorio' && i === 0 ? marcas.card
                    : col.key === 'visitas_atrasadas' && i === 0 ? marcas.atrasada : undefined
                  return <div key={t.id}>{marcar(n, card, true)}</div>
                })}
              </div>
            </section>
          )
          return (
            <div key={col.key}>
              {col.key === 'aguardando_visita' ? marcar(marcas.aguardando, coluna, true) : coluna}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** A coluna "Cobrar censo" do perfil administrativo, com um card. */
export function ReplicaCobranca({ marcas = {} }: { marcas?: Partial<Record<'card', number>> }) {
  const col = COLUNAS.find((c) => c.key === 'cobrancas')!
  return (
    <>
      <style>{kanbanStyles}</style>
      <div style={{ maxWidth: 320 }}>
        <section className="kb-col" style={{ ['--kb-cor' as string]: col.cor }}>
          <header className="kb-col-head">
            <div className="kb-col-title-row">
              <span className="kb-col-title">{col.titulo}</span>
              <span className="kb-col-count">1</span>
            </div>
            <div className="kb-col-desc">{col.descricao}</div>
          </header>
          <div className="kb-col-body">
            {marcar(marcas.card, (
              <KanbanCard tarefa={TAREFA_COBRANCA} corBg={col.corBg} onAbrir={nada} onPrefetch={nada}
                onCobrar={nada} cobrando={false} />
            ), true)}
          </div>
        </section>
      </div>
    </>
  )
}

// ── Envio de Censos ───────────────────────────────────────────────────────────

const OPERADORAS: Operadora[] = [
  { key: 'careplus', nome: 'CarePlus' },
  { key: 'porto', nome: 'Porto Seguro' },
  { key: 'sulamerica', nome: 'SulAmérica' },
]

const HOSPITAIS_ENVIO: Hospital[] = [
  { key: 'santa_clara', nome: 'Hospital Santa Clara', internados: 42, urgente: 3, altas: 5 },
  { key: 'vila_nova', nome: 'Hospital Vila Nova', internados: 18, urgente: 0, altas: 2 },
]

/** O formulário do envio, já com operadora, hospital e dois arquivos anexados.
 *  Os números 1, 2 e 3 são os da própria tela. */
export function ReplicaFormularioEnvio({ etapa = 3 }: {
  /** Até que passo o formulário já foi respondido. */
  etapa?: 1 | 2 | 3
}) {
  const arquivos = useMemo(() => [
    new File([''], 'CENSO_SANTA_CLARA_24-09.pdf'),
    new File([''], 'ALTAS_SANTA_CLARA_24-09.pdf'),
  ], [])
  const hospital = etapa >= 2 ? HOSPITAIS_ENVIO[0] : null
  return (
    <>
      <style>{formularioStyles}</style>
      <Topo titulo="Envio de Censos" sub="Envie os censos que os hospitais mandaram" />
      <FormularioEnvio
        operadoras={OPERADORAS}
        hospitaisDaOperadora={HOSPITAIS_ENVIO}
        hospitalEscolhido={hospital}
        carregandoHospitais={false}
        operadora="careplus"
        hospital={hospital?.key ?? ''}
        files={etapa >= 3 ? arquivos : []}
        busy={false}
        progresso={null}
        onTrocarOperadora={nada}
        onHospital={nada}
        onFiles={nada}
        onSubmit={(e) => e.preventDefault()}
      />
    </>
  )
}

// `id` distinto por linha: é a key da lista, e com ele presente o lápis e a
// lixeira aparecem como aparecem na tela.
let proximoId = 1
const pac = (p: Partial<PacienteGravado> & Pick<PacienteGravado, 'situacao'>): PacienteGravado => ({ id: proximoId++, ...p })

const EM_LEITO: PacienteGravado[] = [
  pac({ situacao: 'INTERNADO', nome: 'ANA BEATRIZ MOURA', atendimento: '771204', carteirinha: '0042881203007',
    leito_codigo: 'UTI-04', convenio: 'CAREPLUS EXECUTIVO', data_entrada: '09/09/2026' }),
  pac({ situacao: 'INTERNADO', nome: 'MARCOS VINICIUS TEIXEIRA', atendimento: '771422', carteirinha: '0042119054001',
    leito_codigo: '405', convenio: 'SAUDE VIDA PLUS', data_entrada: '23/09/2026',
    problema: { tipo: 'convenio_nao_reconhecido', texto: 'O convênio "SAUDE VIDA PLUS" não está no cadastro. O paciente entrou como CarePlus.' } }),
  pac({ situacao: 'INTERNADO', nome: 'LÚCIA FERRAZ', atendimento: '771430', carteirinha: '0042733981002',
    leito_codigo: '312', convenio: 'CAREPLUS', data_entrada: '24/09/2026' }),
]
const COM_ALTA: PacienteGravado[] = [
  pac({ situacao: 'ALTA', nome: 'PEDRO HENRIQUE SALES', atendimento: '770988', leito_codigo: '208',
    convenio: 'CAREPLUS', data_entrada: '15/09/2026', data_alta: '24/09/2026' }),
]

const RESULTADOS: UploadCensoResult[] = [
  { arquivo: 'CENSO_SANTA_CLARA_24-09.pdf', hospital_nome: 'Hospital Santa Clara', total: 38, internados: 38,
    altas: 0, criados: 5, data_censo: '2026-09-24', gravados_detalhe: EM_LEITO,
    convenios_nao_reconhecidos: [{ nome: 'MARCOS VINICIUS TEIXEIRA', atendimento: '771422', convenio: 'SAUDE VIDA PLUS' }] },
  { arquivo: 'ALTAS_SANTA_CLARA_24-09.pdf', hospital_nome: 'Hospital Santa Clara', total: 4, internados: 0,
    altas: 4, criados: 0, data_censo: '2026-09-24', gravados_detalhe: COM_ALTA },
]

/** O resultado de um envio: placar do lote, faixa de pendências, um cartão por
 *  arquivo e o desfazer. É o componente real, com os cartões fechados — como a
 *  tela aparece logo depois de processar. */
export function ReplicaResultadoEnvio() {
  return (
    <>
      <style>{estilosResultado}</style>
      <ResultadoEnvio
        resultados={RESULTADOS}
        pendentes={1}
        semHospital={0}
        criados={5}
        atualizados={33}
        podeDesfazer
        desfazendo={false}
        onCompletar={nada}
        onDesfazer={nada}
        onIgnorar={nada}
        operadoras={OPERADORAS}
      />
    </>
  )
}

/** A lista de conferência de um arquivo aberto: seções de internações e altas,
 *  com o alerta na linha e os botões de remover e editar. */
export function ReplicaConferencia() {
  return (
    <>
      <style>{estilosResultado}</style>
      <div className="up-resultado" style={{ animation: 'none' }}>
        <ListaPacientes emLeito={EM_LEITO} comAlta={COM_ALTA} onEditar={nada} onRemover={nada} />
      </div>
    </>
  )
}

// ── Adicionar paciente (modal do Painel Operacional) ─────────────────────────

const rotulo = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 } as const

/** O modal de cadastro manual, já preenchido, como fica antes de "Adicionar".
 *  A situação vem em Alta de propósito: é o único jeito de mostrar o campo da
 *  data de alta, que só aparece com ela marcada. */
export function ReplicaAdicionarPaciente({ marcas = {} }: {
  marcas?: Partial<Record<'origem' | 'paciente' | 'situacao' | 'opcionais' | 'adicionar', number>>
}) {
  const campo = (nome: string, valor: string, opts: { select?: boolean; placeholder?: string } = {}) => (
    <div>
      <label className="uppercase t-muted" style={rotulo}>{nome}</label>
      {opts.select
        ? <select className="bm-input bm-select" value="v" onChange={nada}><option value="v">{valor || opts.placeholder}</option></select>
        : <input className="bm-input" readOnly value={valor} placeholder={opts.placeholder} />}
    </div>
  )
  return (
    <ModalReplica
      titulo="Adicionar paciente"
      largura={460}
      rodape={
        <>
          <span className="btn btn-outline">Cancelar</span>
          {marcar(marcas.adicionar, <span className="btn btn-primary">Adicionar</span>)}
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {marcar(marcas.origem, (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {campo('Operadora *', 'CarePlus', { select: true })}
            {campo('Hospital *', 'Hospital Santa Clara')}
          </div>
        ), true)}
        {marcar(marcas.paciente, (
          <div style={{ display: 'grid', gap: 12 }}>
            {campo('Nome do paciente *', 'Beatriz Almeida Rocha')}
            {campo('Atendimento *', '771502')}
          </div>
        ), true)}
        {marcar(marcas.situacao, (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="uppercase t-muted" style={rotulo}>Situação *</label>
              <div className="ops-seg">
                <span className="ops-seg-btn">Internado</span>
                <span className="ops-seg-btn active">Alta</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {campo('Data de entrada *', '24/09/2026')}
              {campo('Data de alta *', '26/09/2026')}
            </div>
          </div>
        ), true)}
        {marcar(marcas.opcionais, (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {campo('Leito', '', { select: true, placeholder: 'Selecione…' })}
              {campo('Especialidade', '', { placeholder: 'Opcional' })}
            </div>
            {campo('Médico', '', { placeholder: 'Opcional' })}
          </div>
        ), true)}
      </div>
    </ModalReplica>
  )
}
