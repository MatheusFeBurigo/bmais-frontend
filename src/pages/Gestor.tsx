import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ChartOptions } from 'chart.js'
import type { GestorMetrics } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import { KpiCard, Badge, OpAvatar, LoadingState, opCor } from '../components/ui'
import { Chart, Doughnut, Bar } from '../components/charts'
import PacienteDrawer from '../components/PacienteDrawer'
import MediasCards from '../components/MediasCards'
import Toast from '../components/Toast'
import { Deferred } from '../components/Deferred'
import { useGestor } from '../hooks/useGestor'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { ehHoje, labelCurto } from '../lib/datas'

const GRID = '#EFF2F5'
const AXIS = '#8595A6'
// Tom escuro p/ rótulos de categoria (nomes) nos gráficos — Chart.js não lê CSS
// vars, então replicamos o --ink-2 do design system. Fonte um pouco maior p/ nomes.
const INK = '#1F3344'
const NOME_FONT = { family: 'Geist', size: 13, weight: 500 as const }
// Paleta escura e coesa dos gráficos do Gestor (tons profundos, validados p/
// luminosidade/croma/contraste/CVD). Centralizada para todos os gráficos usarem
// os mesmos hex. `Bg` são versões translúcidas para áreas de linha.
const COR = {
  azul: '#1A5DA8', azulBg: 'rgba(26,93,168,.10)',
  verde: '#0E7A53', verdeBg: 'rgba(14,122,83,.30)',
  laranja: '#C25E10', laranjaBg: 'rgba(194,94,16,.30)',
  roxo: '#6B34B8',
  vermelho: '#A01530',
} as const
// Fonte dos eixos/ticks dos gráficos — aumentada (10→12) para leitura mais fácil.
const MONO = { family: 'Geist Mono', size: 12 }
// Fonte dos títulos de eixo e legendas.
const AXIS_TITLE = { size: 12 as const }
const FAIXA_KEYS = ['0_9', '10_29', '30p'] as const

type FaixaFiltro = '' | '0_9' | '10_29' | '30p' | 'altas'

// Rótulo e cor de cada faixa de permanência (para o bloco de lista sob o donut).
const FAIXA_INFO: Record<'0_9' | '10_29' | '30p', { label: string; cor: string }> = {
  '0_9': { label: 'Até 9 dias', cor: COR.azul },
  '10_29': { label: '10 a 29 dias', cor: COR.laranja },
  '30p': { label: '30+ dias', cor: COR.vermelho },
}

// Janelas do gráfico de fluxo: rótulo por extenso (pill) + descrição p/ o título.
const JANELAS = [
  { key: '30d', pill: '30 dias', titulo: 'últimos 30 dias' },
  { key: '90d', pill: '90 dias', titulo: 'últimos 90 dias' },
  { key: '6m', pill: '6 meses', titulo: 'últimos 6 meses' },
  { key: '1a', pill: '1 ano', titulo: 'último ano' },
] as const
// 6m/1a agrupam por semana/mês → o clique-num-dia não se aplica (desabilitado).
const JANELA_AGRUPADA = new Set(['6m', '1a'])

const localStyles = `
/* Barra de filtro no topo (operadora como pills) */
.gestor-topbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:16px}
.topbar-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:var(--muted);flex-shrink:0}
.op-pills{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
.pill-op{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:99px;font-size:var(--t-base);font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);transition:background .12s,border-color .12s,color .12s;white-space:nowrap}
.pill-op:hover{border-color:var(--border-strong);color:var(--ink)}
/* Ponto colorido da operadora (sempre visível nas pills de operadora) */
.pill-op-dot{width:8px;height:8px;border-radius:50%;background:var(--op-cor);flex-shrink:0}
/* Ativa: pill inteiro na cor da operadora */
.pill-op-cor.active{background:var(--op-cor);border-color:var(--op-cor);color:#fff}
.pill-op-cor.active .pill-op-dot{background:rgba(255,255,255,.85)}
.pill-op-cor.active:hover{filter:brightness(.94)}
/* "Todas" ativa: neutro escuro (não tem cor de operadora) */
.pill-op.active-neutra{background:var(--ink);border-color:var(--ink);color:#fff}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 18px}
.chart-title{font-size:var(--t-base);font-weight:600;color:var(--ink);margin-bottom:2px}
.chart-hint{font-size:var(--t-sm);color:var(--muted-2);margin-bottom:12px}
.pill-faixa{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:99px;font-size:var(--t-base);font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--ink-2);transition:all .12s}
.pill-faixa.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.tbl-gestor tbody tr{cursor:pointer}
.tbl-gestor tbody tr:hover td{background:var(--surface-3)}
.faixa-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
/* Barra de filtros ativos (chips removíveis + limpar tudo) */
.filtros-ativos{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filtros-ativos-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:var(--muted)}
.filtro-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 9px 5px 12px;border-radius:99px;border:1px solid var(--primary-3);background:rgba(21,92,168,.08);color:var(--primary-2);font-size:var(--t-base);font-weight:500;cursor:pointer;transition:background .12s}
.filtro-chip:hover{background:rgba(21,92,168,.16)}
.filtro-chip-tipo{color:var(--muted);font-weight:600}
.filtro-chip svg{opacity:.7}
.filtros-limpar{margin-left:2px}
/* Card do gráfico unificado: título + seletor de data + botão expandir/recolher */
.chart-head-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.chart-head-txt{flex:1;min-width:180px}
.chart-head-sub{font-size:var(--t-sm);color:var(--muted-2);margin-top:2px}
/* Título + dica na MESMA linha (dica ao lado do título) */
.chart-head-inline{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.chart-head-inline .chart-head-sub{margin-top:0;padding-left:10px;border-left:1px solid var(--border)}
/* Seletor de janela (30d/90d/6m/1a) — grupo segmentado compacto */
.janela-pills{display:inline-flex;gap:2px;padding:2px;background:var(--surface-2);border:1px solid var(--border);border-radius:99px;flex-shrink:0}
.pill-janela{padding:4px 14px;border-radius:99px;font-size:var(--t-sm);font-weight:600;cursor:pointer;border:0;background:transparent;color:var(--muted);transition:background .12s,color .12s;white-space:nowrap}
.pill-janela:hover{color:var(--ink-2)}
.pill-janela.active{background:var(--primary-3);color:#fff}
.sub-chart-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--muted)}
.sub-chart-sep{height:1px;background:var(--border);margin:26px 0 22px}
.chart-date{width:auto;flex-shrink:0}
.chart-toggle{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}
.chart-chevron{flex-shrink:0;transition:transform .18s ease}
.chart-chevron.aberto{transform:rotate(180deg)}
/* Barra full-width de expandir (estado colapsado): vai de ponta a ponta */
.chart-expand-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;text-align:left;color:inherit;transition:background .12s,border-color .12s}
.chart-expand-bar:hover{background:var(--surface-2);border-color:var(--border-strong)}
.chart-expand-txt{display:flex;flex-direction:column;gap:2px;min-width:0}
.chart-expand-txt b{font-size:var(--t-base);font-weight:600;color:var(--ink)}
.chart-expand-txt span{font-size:var(--t-sm);color:var(--muted-2)}
.chart-expand-cta{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;font-size:var(--t-base);font-weight:600;color:var(--primary-3)}
.chart-expand-bar:hover .chart-expand-cta{color:var(--primary-2)}
/* Chip da data selecionada — deixa o dia analisado bem evidente */
.dia-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:99px;background:var(--primary-3);color:#fff;font-family:var(--font-mono);font-size:var(--t-base);font-weight:600;letter-spacing:.01em;flex-shrink:0}
.dia-chip.com-remover{padding-right:5px}
.dia-chip-x{display:inline-flex;align-items:center;justify-content:center;margin-left:2px;padding:2px;border:0;border-radius:99px;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;opacity:.85;transition:background .12s,opacity .12s}
.dia-chip-x:hover{background:rgba(255,255,255,.32);opacity:1}
.dia-chip svg{opacity:.85}
/* Data selecionada exibida ABAIXO da barra do gráfico recolhido */
.dia-abaixo{display:flex;align-items:center;gap:10px;margin-top:10px}
.dia-abaixo-lbl{font-size:var(--t-sm);text-transform:uppercase;letter-spacing:.08em;font-weight:600;color:var(--muted)}
/* Refetch (troca de dia/filtro): atenua sem sumir — nada de "recarregando" */
.gestor-conteudo{transition:opacity .2s ease}
.gestor-conteudo.atualizando{opacity:.55}
/* Transição de recolhimento/entrada do card do gráfico e dos dados do dia */
.chart-reveal{animation:chartReveal .28s cubic-bezier(.2,.7,.2,1)}
@keyframes chartReveal{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.chart-reveal{animation:none}.gestor-conteudo{transition:none}}
`

export default function Gestor() {
  const [params, setParams] = useSearchParams()
  const fData = params.get('data') || ''
  const fOperadora = params.get('operadora') || ''
  const fHospital = params.get('hospital') || ''
  const fRegiao = params.get('regiao') || ''
  const fJanela = params.get('janela') || '30d'

  const [faixa, setFaixa] = useState<FaixaFiltro>('')
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const prefetchPaciente = usePrefetchInternacao()

  // O backend devolve métricas e opções de filtro num único payload aninhado
  // ({ metrics, filtros }) — não há rota /gestor/filtros separada.
  const { data: payload, isLoading, isError, isFetching } = useGestor({
    data: fData, operadora: fOperadora, hospital: fHospital, regiao: fRegiao, janela: fJanela,
  })
  const m = payload?.metrics
  const filtros = payload?.filtros
  // Refetch com dados anteriores em tela (troca de dia/filtro): não mostramos o
  // loading de tela cheia — só atenuamos levemente enquanto os novos dados chegam.
  const atualizando = isFetching && !isLoading

  // Atualiza um conjunto de query params de uma vez (equivale ao urlCom do template).
  function setFiltro(patch: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  // Escopo de dados: `filtros.operadoras`/`filtros.hospitais` já vêm recortados
  // ao que o usuário pode ver. Se a URL trouxer uma operadora/hospital fora do
  // escopo (?operadora=X direto), limpa o filtro — não fica preso num recorte
  // vazio de dados que não são dele (o backend já não retorna essas linhas).
  useEffect(() => {
    if (!filtros) return
    const patch: Record<string, string> = {}
    if (fOperadora && !filtros.operadoras.some((o) => o.key === fOperadora)) patch.operadora = ''
    if (fHospital && !filtros.hospitais.some((h) => h.key === fHospital)) patch.hospital = ''
    if (Object.keys(patch).length > 0) setFiltro(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, fOperadora, fHospital])

  function toggleFaixa(f: FaixaFiltro) {
    setFaixa((cur) => (cur === f ? '' : f))
  }

  // "Dia histórico": uma data anterior a hoje está selecionada. Baseia-se no
  // `m.dia` resolvido pelo backend (não em fData, que pode estar vazio = hoje).
  const diaHistorico = !!m && !ehHoje(m.dia)
  // Sufixo curto p/ rótulos dos KPIs: "em 19/07" quando dia histórico, senão "".
  const sufixoDia = diaHistorico ? ` em ${labelCurto(m!.dia)}` : ''
  // Nome da operadora filtrada (via clique no gráfico de operadora ou chip) —
  // deixa explícito no título "por hospital" que a lista é daquela operadora.
  const nomeOpFiltrada = fOperadora ? (filtros?.operadoras.find((o) => o.key === fOperadora)?.nome || fOperadora) : ''
  // Nome do hospital filtrado (via clique no gráfico de hospital ou chip) —
  // deixa explícito no título da lista que ela é só daquele hospital.
  const nomeHospFiltrado = fHospital ? (filtros?.hospitais.find((h) => h.key === fHospital)?.nome || fHospital) : ''
  // Janela do gráfico de fluxo: título descritivo e se está agrupada (sem clique-dia).
  const janelaTitulo = (JANELAS.find((j) => j.key === fJanela) ?? JANELAS[0]).titulo
  const janelaAgrupada = JANELA_AGRUPADA.has(fJanela)

  // O gráfico de 30 dias funciona como acordeão: aberto por padrão (é por ele
  // que se escolhe o dia clicando); ao selecionar um dia específico ele colapsa
  // para dar espaço às métricas daquele dia. O usuário pode reabrir para trocar.
  const [graficoAberto, setGraficoAberto] = useState(true)
  // Sincroniza o padrão quando o modo muda: dia selecionado → colapsa; hoje → abre.
  useEffect(() => { setGraficoAberto(!diaHistorico) }, [diaHistorico])

  const visiveis = useMemo(() => {
    const lista = m?.pacientes_dia ?? []
    if (!faixa) return lista
    if (faixa === 'altas') return lista.filter((p) => p.situacao === 'ALTA')
    return lista.filter((p) => p.faixa === faixa && p.situacao === 'INTERNADO')
  }, [m, faixa])

  // Todos os recortes ativos como chips removíveis — incluindo o dia. Cada clique
  // num gráfico (operadora/hospital/região/faixa) ou num dia gera o chip aqui.
  // Resolve os nomes de operadora/hospital a partir das opções; região e faixa
  // já têm rótulo. Lista pequena e barata — calculada a cada render (sem useMemo).
  const chipsFiltros: Array<{ tipo: string; label: string; onRemove: () => void }> = []
  {
    const nomeOp = filtros?.operadoras.find((o) => o.key === fOperadora)?.nome
    const nomeHosp = filtros?.hospitais.find((h) => h.key === fHospital)?.nome
    const faixaLabel = faixa === 'altas' ? 'Altas'
      : faixa && faixa in FAIXA_INFO ? FAIXA_INFO[faixa as keyof typeof FAIXA_INFO].label : ''
    if (diaHistorico) chipsFiltros.push({ tipo: 'Dia', label: m!.dia_label, onRemove: () => setFiltro({ data: '' }) })
    if (fOperadora) chipsFiltros.push({ tipo: 'Operadora', label: nomeOp || fOperadora, onRemove: () => setFiltro({ operadora: '', hospital: '' }) })
    if (fHospital) chipsFiltros.push({ tipo: 'Hospital', label: nomeHosp || fHospital, onRemove: () => setFiltro({ hospital: '' }) })
    if (fRegiao) chipsFiltros.push({ tipo: 'Região', label: fRegiao, onRemove: () => setFiltro({ regiao: '' }) })
    if (faixa) chipsFiltros.push({ tipo: 'Permanência', label: faixaLabel, onRemove: () => setFaixa('') })
  }

  // Desfaz TUDO de uma vez e restaura o estado inicial: zera os recortes
  // (operadora/hospital/região/faixa) E limpa o dia — assim o gráfico volta a
  // expandir (30 dias) e as médias reaparecem, como no "Ver todo o período".
  const limparTudo = () => {
    setFaixa('')
    setFiltro({ operadora: '', hospital: '', regiao: '', data: '' })
  }

  const subtitle = m
    ? `${diaHistorico ? 'Dia' : 'Fluxo diário de internações ·'} ${m.dia_label}`
    : undefined

  usePageHeader({ title: 'Painel do Gestor', subtitle })

  return (
    <>
      <style>{localStyles}</style>

      {/* Barra de filtro no topo — operadora como pills clicáveis (só operadora;
          hospital/região vêm dos cliques nos gráficos). Filtro GLOBAL: refaz a
          busca, afetando todo o painel. */}
      {m && filtros && filtros.operadoras.length > 0 && (
        <div className="gestor-topbar">
          <span className="topbar-lbl">Operadora</span>
          <div className="op-pills">
            <button type="button" className={`pill-op${!fOperadora ? ' active-neutra' : ''}`}
              onClick={() => setFiltro({ operadora: '', hospital: '' })}>Todas</button>
            {filtros.operadoras.map((o) => (
              <button key={o.key} type="button"
                className={`pill-op pill-op-cor${fOperadora === o.key ? ' active' : ''}`}
                style={{ ['--op-cor' as string]: opCor(o.key) }}
                onClick={() => setFiltro({ operadora: o.key, hospital: '' })}>
                <span className="pill-op-dot" />
                {o.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros ativos: chips removíveis individualmente + "Limpar tudo"
          (mantém o dia). Só aparece quando há algum recorte aplicado. */}
      {chipsFiltros.length > 0 && (
        <div className="filtros-ativos">
          <span className="filtros-ativos-lbl">Filtros ativos</span>
          {chipsFiltros.map((c) => (
            <button key={c.tipo} type="button" className="filtro-chip" onClick={c.onRemove} title={`Remover ${c.tipo}`}>
              <span className="filtro-chip-tipo">{c.tipo}:</span> {c.label}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          ))}
          <button type="button" className="btn btn-ghost btn-sm filtros-limpar" onClick={limparTudo}>
            Limpar tudo
          </button>
        </div>
      )}

      {isLoading && <LoadingState label="Carregando painel…" />}
      {isError && <div className="empty-state t-danger">Erro ao carregar o painel.</div>}

      {m && (
        <div className={`gestor-conteudo${atualizando ? ' atualizando' : ''}`}>
          {/* KPIs do dia (clicáveis → filtram a lista) */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
            <KpiCard variant="primary-kpi"
              label={diaHistorico ? `Internados${sufixoDia}` : 'Internados até o momento'}
              value={m.hoje.internados}
              meta={diaHistorico ? `total ativo em ${m.dia_label}` : 'total ativo agora'}
              active={faixa === ''} onClick={() => toggleFaixa('')} />
            <KpiCard variant="info" label="Até 9 dias" value={m.hoje.f0_9}
              meta="permanência curta" active={faixa === '0_9'} onClick={() => toggleFaixa('0_9')} />
            <KpiCard variant="warning" label="10 a 29 dias" value={m.hoje.f10_29}
              meta="permanência prolongada" active={faixa === '10_29'} onClick={() => toggleFaixa('10_29')} />
            <KpiCard variant="danger" label="30+ dias" value={m.hoje.f30}
              meta="permanência crítica" active={faixa === '30p'} onClick={() => toggleFaixa('30p')} />
            <KpiCard variant="success" label={diaHistorico ? `Altas${sufixoDia}` : 'Altas do Dia'} value={m.hoje.altas}
              meta={`${m.hoje.entradas} novas entradas`} active={faixa === 'altas'} onClick={() => toggleFaixa('altas')} />
          </div>

          {/* Médias de período (Mês/Semestral/Anual) — só no modo geral; ao
              analisar um dia específico não se aplicam (agregados de período). */}
          {!diaHistorico && (
            <div className="chart-reveal">
              <MediasCards medias={{ media_mes: m.media_mes, media_semestre: m.media_semestre, media_ano: m.media_ano }} />
            </div>
          )}

          {/* Gráficos + tabela adiados para depois do primeiro paint dos KPIs —
              o cliente vê os números do dia imediatamente. */}
          <Deferred
            delaySteps={2}
            minHeight={560}
            placeholder={<LoadingState label="Carregando gráficos…" style={{ minHeight: 560 }} />}
          >
          {/* Fluxo 30 dias — componente único de seleção de dia.
              · Colapsado: uma BARRA full-width clicável (de ponta a ponta) que
                expande o gráfico — a única ação, óbvia e larga.
              · Aberto: header com título + seletor de data + recolher, e o
                gráfico (clicar numa coluna escolhe o dia e colapsa). */}
          {graficoAberto ? (
            <div className="chart-card chart-reveal" key="aberto" style={{ marginBottom: 16 }}>
              <div className="chart-head-row">
                <div className="chart-head-txt chart-head-inline">
                  <span className="chart-title">Fluxo dos {janelaTitulo}</span>
                  <span className="chart-head-sub">
                    {janelaAgrupada
                      ? 'Tendência do período (agrupada)'
                      : 'Clique num dia no gráfico ou escolha a data ao lado'}
                  </span>
                </div>
                {/* Seletor de janela: período/agrupamento do gráfico de fluxo. */}
                <div className="janela-pills">
                  {JANELAS.map((j) => (
                    <button key={j.key} type="button"
                      className={`pill-janela${fJanela === j.key ? ' active' : ''}`}
                      onClick={() => setFiltro({ janela: j.key === '30d' ? '' : j.key })}>
                      {j.pill}
                    </button>
                  ))}
                </div>
                {/* Volta ao período completo: limpa a data → sem dia destacado,
                    médias e KPIs voltam ao geral. Só aparece com um dia ativo. */}
                {diaHistorico && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setFiltro({ data: '' })}>
                    Ver todo o período
                  </button>
                )}
                <input
                  type="date"
                  className="bm-input chart-date"
                  value={m.dia}
                  onChange={(e) => setFiltro({ data: e.target.value })}
                  aria-label="Selecionar dia"
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm chart-toggle"
                  onClick={() => setGraficoAberto(false)}
                  aria-expanded
                >
                  <svg className="chart-chevron aberto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  Recolher
                </button>
              </div>
              {(() => {
                const diaSel = diaHistorico ? m.dia : null
                // Em 6m/1a (agrupado por semana/mês) o clique-num-dia não se aplica.
                const onDia = janelaAgrupada
                  ? undefined
                  : (dia: string) => { setFiltro({ data: dia }); setGraficoAberto(false) }
                return (
                  <>
                    {/* Ocupação (ESTOQUE): quantos leitos ocupados por dia. */}
                    <div className="sub-chart-lbl" style={{ marginTop: 18 }}>Ocupação · internados por dia</div>
                    <div style={{ height: 210, marginTop: 8 }}>
                      <OcupacaoChart m={m} diaSelecionado={diaSel} onDia={onDia} />
                    </div>
                    <div className="sub-chart-sep" />
                    {/* Fluxo diário (FLUXO): entradas vs altas + saldo do dia. */}
                    <div className="sub-chart-lbl">Fluxo diário · entradas, altas e saldo</div>
                    <div style={{ height: 190, marginTop: 8 }}>
                      <FluxoDiarioChart m={m} diaSelecionado={diaSel} onDia={onDia} />
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="chart-reveal" key="colapsado" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="chart-expand-bar"
                onClick={() => setGraficoAberto(true)}
                aria-expanded={false}
              >
                <span className="chart-expand-txt">
                  <b>Fluxo dos {janelaTitulo}</b>
                  <span>Dia analisado abaixo · expandir para navegar pelo período</span>
                </span>
                <span className="chart-expand-cta">
                  Expandir gráfico
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </button>
              {/* Data selecionada — FORA da barra, logo abaixo do gráfico recolhido.
                  Ao lado, um atalho para voltar ao período completo (limpa a data). */}
              {diaHistorico && (
                <div className="dia-abaixo">
                  <span className="dia-abaixo-lbl">Analisando o dia</span>
                  <DiaChip label={m.dia_label} onRemove={() => setFiltro({ data: '' })} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setFiltro({ data: '' })}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                    Ver todo o período
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Permanência (donut) + Internados por hospital + por região, lado a
              lado. (O "Internados por operadora" foi removido — a operadora agora
              é escolhida pelos pills do topo.) */}
          <div style={{ display: 'grid', gridTemplateColumns: m.por_regiao.length > 1 ? '320px 1fr 1fr' : '320px 1fr', gap: 16, marginBottom: 16 }}>
            <div className="chart-card">
              <div className="chart-title">Permanência por período</div>
              <div className="chart-hint">Clique numa faixa para listar os internados dela abaixo</div>
              <div style={{ height: 300 }}>
                <FaixasDonut m={m} onFaixa={(f) => toggleFaixa(f)} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">
                Internados por hospital{nomeOpFiltrada && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {nomeOpFiltrada}</span>}
              </div>
              <div className="chart-hint">
                {nomeOpFiltrada
                  ? `Principais hospitais de ${nomeOpFiltrada} · clique numa barra para filtrar`
                  : 'Clique numa barra para filtrar; clique de novo para desfazer'}
              </div>
              <div style={{ height: 300 }}>
                <HospBar m={m} selKey={fHospital} onHosp={(key) => setFiltro({ hospital: key === fHospital ? '' : key })} />
              </div>
            </div>
            {m.por_regiao.length > 1 && (
              <div className="chart-card">
                <div className="chart-title">Internados por região</div>
                <div className="chart-hint">Clique numa barra para filtrar; clique de novo para desfazer</div>
                <div style={{ height: 300 }}>
                  <RegBar m={m} selNome={fRegiao} onReg={(nome) => setFiltro({ regiao: nome === fRegiao ? '' : nome })} />
                </div>
              </div>
            )}
          </div>

          {/* Lista de pacientes — logo abaixo do donut, com os pills de filtro
              JUNTO da tabela. Manter o gatilho (pills) junto do conteúdo que ele
              filtra evita o "pulo" de scroll: nada de altura variável fica abaixo
              dos pills que o usuário acabou de clicar. */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                Pacientes {diaHistorico ? `de ${m.dia_label}` : 'internados'}
                {nomeHospFiltrado && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {nomeHospFiltrado}</span>}
                {' · '}<span>{visiveis.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`pill-faixa${faixa === '' ? ' active' : ''}`} onClick={() => toggleFaixa('')}>Todos</span>
                <span className={`pill-faixa${faixa === '0_9' ? ' active' : ''}`} onClick={() => toggleFaixa('0_9')}><span className="faixa-dot" style={{ background: COR.azul }} />Até 9d</span>
                <span className={`pill-faixa${faixa === '10_29' ? ' active' : ''}`} onClick={() => toggleFaixa('10_29')}><span className="faixa-dot" style={{ background: COR.laranja }} />10–29d</span>
                <span className={`pill-faixa${faixa === '30p' ? ' active' : ''}`} onClick={() => toggleFaixa('30p')}><span className="faixa-dot" style={{ background: COR.vermelho }} />30+d</span>
                <span className={`pill-faixa${faixa === 'altas' ? ' active' : ''}`} onClick={() => toggleFaixa('altas')}><span className="faixa-dot" style={{ background: COR.verde }} />Altas</span>
              </div>
            </div>
            <TabelaPacientes pacientes={visiveis} onSelecionar={setDrawerId} onPrefetch={prefetchPaciente} vazio={diaHistorico ? 'Nenhum paciente neste dia' : 'Nenhum paciente internado'} />
          </div>

          </Deferred>
        </div>
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => { setDrawerId(null); setToast(msg) }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

// Tabela de pacientes reutilizável (lista principal do dia e lista da faixa
// sob o donut). `vazio` customiza a mensagem quando não há linhas.
function TabelaPacientes({ pacientes, onSelecionar, onPrefetch, vazio, maxHeight = 480 }: {
  pacientes: GestorMetrics['pacientes_dia']
  onSelecionar: (id: number) => void
  onPrefetch?: (id: number) => void
  vazio?: string
  maxHeight?: number
}) {
  return (
    <div style={{ maxHeight, overflowY: 'auto' }}>
      <table className="bmais-table tbl-gestor">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Hospital</th>
            <th>Operadora</th>
            <th>Entrada</th>
            <th className="t-right">Dias</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id} onClick={() => onSelecionar(p.id)}
              onMouseEnter={onPrefetch ? () => onPrefetch(p.id) : undefined}
              onFocus={onPrefetch ? () => onPrefetch(p.id) : undefined}>
              <td>
                <div className="fw-6 truncate" style={{ maxWidth: 220 }}>{p.nome}</div>
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }} className="mono">{p.atendimento}</div>
              </td>
              <td className="truncate" style={{ maxWidth: 200, fontSize: 'var(--t-base)' }}>{p.hospital_nome}</td>
              <td><OpAvatar opKey={p.operadora_key} size={24} /></td>
              <td className="mono" style={{ fontSize: 'var(--t-base)' }}>{p.data_entrada}</td>
              <td className="t-right mono fw-6" style={{ color: p.faixa === '30p' ? COR.vermelho : p.faixa === '10_29' ? COR.laranja : undefined }}>{p.dias}</td>
              <td>
                {p.situacao === 'ALTA'
                  ? <Badge variant="success" dot>Alta</Badge>
                  : <Badge variant="info" dot>Internado</Badge>}
              </td>
            </tr>
          ))}
          {pacientes.length === 0 && (
            <tr>
              <td colSpan={6}>
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{vazio || 'Nenhum paciente'}</div>
                  <div style={{ fontSize: 'var(--t-sm)' }}>Ajuste os filtros ou escolha outra data.</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// Chip que evidencia o dia selecionado (ícone de calendário + data em destaque).
// Com `onRemove`, ganha um × interno para remover o filtro de dia direto no chip.
function DiaChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className={`dia-chip${onRemove ? ' com-remover' : ''}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      {label}
      {onRemove && (
        <button type="button" className="dia-chip-x" onClick={onRemove} aria-label="Remover filtro de dia">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </span>
  )
}

function pointerCursor(evt: { native: Event | null }, els: unknown[]) {
  const target = evt.native?.target as HTMLElement | undefined
  if (target) target.style.cursor = els.length ? 'pointer' : 'default'
}

// Helpers compartilhados pelos dois gráficos do fluxo (ocupação e fluxo diário):
// clique-no-dia por índice e ticks do eixo X com o dia selecionado em destaque.
function usarSerieFluxo(serie: GestorMetrics['serie_30d'], diaSelecionado: string | null,
                        onDia?: (dia: string) => void) {
  const idxSel = diaSelecionado ? serie.findIndex((s) => s.dia === diaSelecionado) : -1
  // Sem onDia (janela agrupada 6m/1a) o gráfico não é clicável para escolher dia.
  const onClick = onDia
    ? (evt: unknown, _els: unknown, chart: { getElementsAtEventForMode: (e: Event, m: string, o: object, u: boolean) => Array<{ index: number }> }) => {
        const pts = chart.getElementsAtEventForMode(evt as Event, 'index', { intersect: false }, true)
        if (pts.length) onDia(serie[pts[0].index].dia)
      }
    : undefined
  const xTicks = {
    maxRotation: 0, autoSkip: true, maxTicksLimit: 10,
    color: (c: { index: number }) => (c.index === idxSel ? COR.azul : AXIS),
    font: (c: { index: number }) => (c.index === idxSel ? { ...MONO, weight: 'bold' as const } : MONO),
  }
  return { idxSel, onClick, xTicks }
}

// 1a. OCUPAÇÃO (estoque): linha de internados — "quantos leitos ocupados por
// dia". Eixo único, própria escala. Separado do fluxo diário porque é uma
// grandeza distinta (nível acumulado, não movimento).
function OcupacaoChart({ m, diaSelecionado, onDia }: {
  m: GestorMetrics; diaSelecionado: string | null; onDia?: (dia: string) => void
}) {
  const serie = m.serie_30d
  const { idxSel, onClick, xTicks } = usarSerieFluxo(serie, diaSelecionado, onDia)
  const options: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick, onHover: onClick ? pointerCursor : undefined,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, titleFont: { size: 13 }, bodyFont: { size: 13 } } },
    scales: {
      y: { beginAtZero: true, border: { display: false }, grid: { color: GRID }, ticks: { font: MONO, color: AXIS, maxTicksLimit: 6, precision: 0 } },
      x: { grid: { display: false }, border: { color: GRID }, ticks: xTicks },
    },
  }
  return (
    <Chart
      type="line"
      options={options}
      data={{
        labels: serie.map((s) => s.label),
        datasets: [
          { label: 'Internados', data: serie.map((s) => s.internados), borderColor: COR.azul, borderWidth: 2, backgroundColor: COR.azulBg, fill: true, tension: 0.35, pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === idxSel ? 4 : 0), pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: COR.azul, pointBorderWidth: 2 },
        ],
      }}
    />
  )
}

// 1b. FLUXO DIÁRIO (fluxo): entradas vs altas em barras AGRUPADAS (não
// empilhadas — têm sinais opostos sobre a ocupação) + linha de SALDO líquido
// (entradas − altas), que é o que de fato move a ocupação. Eixo próprio (0..~10).
function FluxoDiarioChart({ m, diaSelecionado, onDia }: {
  m: GestorMetrics; diaSelecionado: string | null; onDia?: (dia: string) => void
}) {
  const serie = m.serie_30d
  const { idxSel, onClick, xTicks } = usarSerieFluxo(serie, diaSelecionado, onDia)
  // Gradiente vertical (cor viva no topo → transparente na base) para dar volume
  // às barras. Cai para cor sólida enquanto o layout do canvas não existe.
  const grad = (top: string, bottom: string, solido: string) =>
    (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } }; dataIndex: number }) => {
      const area = ctx.chart.chartArea
      const atenua = idxSel >= 0 && ctx.dataIndex !== idxSel
      if (!area) return solido
      const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
      g.addColorStop(0, atenua ? bottom : top)
      g.addColorStop(1, bottom)
      return g
    }
  const options: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick, onHover: onClick ? pointerCursor : undefined,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 14, usePointStyle: true, font: AXIS_TITLE } },
      tooltip: { mode: 'index', intersect: false, titleFont: { size: 13 }, bodyFont: { size: 13 } },
    },
    scales: {
      // Sem beginAtZero: o SALDO pode ser negativo (dias com mais altas que
      // entradas = ocupação cai). A linha do grid no 0 fica mais marcada para
      // separar visualmente "sobe" (acima) de "desce" (abaixo).
      y: {
        border: { display: false },
        grid: {
          color: (c: { tick: { value: number } }) => (c.tick.value === 0 ? AXIS : GRID),
          lineWidth: (c: { tick: { value: number } }) => (c.tick.value === 0 ? 1.5 : 1),
        },
        ticks: { font: MONO, color: AXIS, maxTicksLimit: 5, precision: 0 },
      },
      x: { grid: { display: false }, border: { color: GRID }, ticks: xTicks },
    },
  }
  // Ponto do saldo por sinal: negativo = laranja (ocupação caiu naquele dia).
  const corPontoSaldo = (ctx: { dataIndex: number }) => {
    const s = serie[ctx.dataIndex]
    return (s ? s.entradas - s.altas : 0) < 0 ? COR.laranja : COR.roxo
  }
  return (
    <Chart
      type="bar"
      options={options}
      data={{
        labels: serie.map((s) => s.label),
        datasets: [
          // Barras AGRUPADAS lado a lado (não empilhadas): o olho compara entra x sai.
          // Cores vivas com gradiente vertical; cantos bem arredondados.
          { type: 'bar' as const, label: 'Entradas', data: serie.map((s) => s.entradas), backgroundColor: grad(COR.verde, COR.verdeBg, COR.verde), borderRadius: 5, borderSkipped: false, categoryPercentage: 0.72, barPercentage: 0.92, order: 3 },
          { type: 'bar' as const, label: 'Altas', data: serie.map((s) => s.altas), backgroundColor: grad(COR.laranja, COR.laranjaBg, COR.laranja), borderRadius: 5, borderSkipped: false, categoryPercentage: 0.72, barPercentage: 0.92, order: 2 },
          // Linha de SALDO (entradas − altas): positivo = ocupação sobe. Roxo
          // profundo por cima das barras, SEM área de preenchimento — a área
          // translúcida cobria e desbotava as cores das barras.
          { type: 'line' as const, label: 'Saldo (entradas − altas)', data: serie.map((s) => s.entradas - s.altas), borderColor: COR.roxo, borderWidth: 2.5, fill: false, tension: 0.35, pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === idxSel ? 5 : 2.5), pointHoverRadius: 6, pointBackgroundColor: '#fff', pointBorderColor: corPontoSaldo, pointBorderWidth: 2, order: 1 },
        ],
      }}
    />
  )
}

// 2. Donut faixas — clique filtra a tabela
function FaixasDonut({ m, onFaixa }: { m: GestorMetrics; onFaixa: (f: '0_9' | '10_29' | '30p') => void }) {
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    onClick: (_evt, els) => { if (els.length) onFaixa(FAIXA_KEYS[els[0].index]) },
    onHover: pointerCursor,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: AXIS_TITLE } } },
  }
  return (
    <Doughnut
      options={options}
      data={{
        labels: ['Até 9 dias', '10–29 dias', '30+ dias'],
        datasets: [{ data: [m.hoje.f0_9, m.hoje.f10_29, m.hoje.f30], backgroundColor: [COR.azul, COR.laranja, COR.vermelho], borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
      }}
    />
  )
}

// 4. Barras horizontais por hospital (top 12) — clique filtra por hospital.
// Cor sólida única (mesmo conceito dos gráficos de operadora/região). Quando um
// hospital está filtrado (`selKey`), ele fica em cor cheia e os demais esmaecem.
function HospBar({ m, selKey, onHosp }: { m: GestorMetrics; selKey: string; onHosp: (key: string) => void }) {
  const hosps = m.por_hospital.slice(0, 12)
  const corBarra = (ctx: { dataIndex: number }) =>
    !selKey || hosps[ctx.dataIndex]?.key === selKey ? COR.azul : 'rgba(26,93,168,.30)'
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false }, // clicar em qualquer ponto da linha
    onClick: (_evt, els) => { if (els.length) onHosp(hosps[els[0].index].key) },
    onHover: pointerCursor,
    layout: { padding: { right: 28 } }, // espaço p/ o valor no fim da barra
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0 } },
      // Nomes dos hospitais em tom escuro e fonte maior — leitura mais fácil.
      y: { grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK, crossAlign: 'far' as const } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        // Menos truncação (34) e barras um pouco mais grossas.
        labels: hosps.map((h) => (h.nome.length > 34 ? h.nome.slice(0, 33) + '…' : h.nome)),
        datasets: [{
          label: 'Internados',
          data: hosps.map((h) => h.internados),
          backgroundColor: corBarra,
          borderRadius: 4,
          barPercentage: 0.82,
          categoryPercentage: 0.86,
        }],
      }}
    />
  )
}

// 5. Barras por região — clique filtra por região (ignora "Sem região").
// Destaca a região filtrada (`selNome`) e esmaece as demais.
function RegBar({ m, selNome, onReg }: { m: GestorMetrics; selNome: string; onReg: (nome: string) => void }) {
  const regs = m.por_regiao
  const corBarra = (ctx: { dataIndex: number }) =>
    !selNome || regs[ctx.dataIndex]?.nome === selNome ? COR.roxo : 'rgba(107,52,184,.30)'
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false }, // clicar em qualquer ponto da linha
    onClick: (_evt, els) => {
      if (els.length && regs[els[0].index].nome !== 'Sem região') onReg(regs[els[0].index].nome)
    },
    onHover: pointerCursor,
    plugins: { legend: { display: false }, tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } } },
    scales: {
      x: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { font: MONO, color: AXIS, precision: 0 } },
      y: { grid: { display: false }, border: { color: GRID }, ticks: { font: NOME_FONT, color: INK } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: regs.map((r) => r.nome),
        datasets: [{ label: 'Internados', data: regs.map((r) => r.internados), backgroundColor: corBarra, borderRadius: 4, barPercentage: 0.82, categoryPercentage: 0.86 }],
      }}
    />
  )
}
