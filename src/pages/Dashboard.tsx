import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageHeader } from '../components/PageHeader'
import PacienteDrawer from '../components/PacienteDrawer'
import AddPacienteModal from '../components/dashboard/AddPacienteModal'
import { useAuth } from '../auth/AuthContext'
import { ehSomenteLeitura, podeVer } from '../auth/permissions'
import ExportarModal from '../components/dashboard/ExportarModal'
import StatusAtualizacao from '../components/dashboard/StatusAtualizacao'
import Toast from '../components/Toast'
import { Spinner, Skeleton, opInitial } from '../components/ui'
import { Deferred } from '../components/Deferred'
import InternadosTable from '../components/internados/InternadosTable'
import HospitalDetalhesModal from '../components/HospitalDetalhesModal'
import { TabelaSkeleton } from '../components/internados/DashboardSkeleton'
import { useDashboard, useDashboardOverview, useAtualizarVisaoGeral } from '../hooks/useDashboard'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { useIsFetching } from '@tanstack/react-query'
import { queryRoots } from '../lib/queryKeys'
import { AUTO_REFRESH_MS } from '../lib/autoRefresh'
import { NOME_TODAS } from '../services/dashboard.service'
import type {
  DashboardOverview, DashboardOverviewOperadora, DashboardStats, Hospital, Internacao,
} from '../types/api'

// Campos do stats que fazem sentido SOMADOS entre operadoras (os KPIs do topo).
// Limites de permanência etc. dependem das regras de cada operadora e ficam de fora.
const STATS_SOMAVEIS = [
  'total_internados', 'sem_relatorio', 'relatorio_vencido', 'proximo_vencer',
  'relatorio_em_dia', 'em_monitoramento', 'longa_10', 'longa_30',
] as const

// Panorama CONSOLIDADO (todas as operadoras do escopo) derivado do overview, sem
// round-trip extra: soma os KPIs e concatena os hospitais etiquetados pela
// operadora. Sai no MESMO formato de uma operadora, para a tela ter um só caminho.
function consolidarOverview(overview: DashboardOverview | undefined): DashboardOverviewOperadora | undefined {
  if (!overview) return undefined
  const stats: DashboardStats = { hoje_efetivo: overview.hoje_efetivo }
  for (const campo of STATS_SOMAVEIS) stats[campo] = 0
  const hospitais: Hospital[] = []
  // `lista` já vem recortada ao escopo do usuário e na ordem do cadastro.
  for (const { key } of overview.lista) {
    const op = overview.operadoras[key]
    if (!op) continue
    for (const campo of STATS_SOMAVEIS) {
      stats[campo] = Number(stats[campo] || 0) + Number(op.stats[campo] || 0)
    }
    for (const h of op.hospitais) {
      hospitais.push({ ...h, operadora_key: key, operadora_nome: op.op_nome })
    }
  }
  return { operadora: '', op_nome: NOME_TODAS, stats, hospitais }
}

// Fallbacks ESTÁVEIS para quando nem panorama nem detalhe chegaram: um `[]`
// literal no render seria um array novo a cada passagem e invalidaria os useMemo.
const SEM_HOSPITAIS: Hospital[] = []
const SEM_INTERNACOES: Internacao[] = []

// Ícone do avatar no modo consolidado (mesma grade da "Visão Geral" na sidebar).
const IconTodas = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
)

export default function Dashboard() {
  const [params, setParams] = useSearchParams()
  // Operadora aberta. VAZIA = visão CONSOLIDADA (todas as operadoras do escopo) —
  // é o estado inicial da Visão Geral. Nada fixa uma operadora na URL por conta
  // própria: só o usuário (seletor/sidebar) recorta para uma operadora.
  const operadora = params.get('operadora') || ''
  const todas = !operadora
  const filtro = params.get('filtro') || 'todos'
  const hospital = params.get('hospital') || ''

  // Filtros client-side
  const [busca, setBusca] = useState('')
  const [utiOn, setUtiOn] = useState(false)
  const [d30On, setD30On] = useState(false)
  // Permanência: '' (todas), '10' (≥10d, campo longa_10) ou '30' (≥30d, longa_30).
  // Usa os campos reais (limites por operadora) — coerente com a coluna Permanência.
  const [permanencia, setPermanencia] = useState<'' | '10' | '30'>('')
  // Ordenação da lista: '' (padrão do backend), 'sem_rel' (mais dias sem relatório
  // primeiro) ou 'dias' (mais dias internado primeiro). Ajuda a priorizar.
  const [ordenar, setOrdenar] = useState<'' | 'sem_rel' | 'dias'>('')
  const [drawerId, setDrawerId] = useState<number | null>(null)
  // Hospital cuja ficha está aberta (clique no nome, na coluna Hospital).
  const [hospitalFicha, setHospitalFicha] = useState<{ key: string; nome: string } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  // Perfil de observação (analista interno): sem ações que alteram dados.
  const { role } = useAuth()
  const navigate = useNavigate()
  const somenteLeitura = ehSomenteLeitura(role)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const prefetchPaciente = usePrefetchInternacao()

  // Panorama de TODAS as operadoras (recortado ao escopo do usuário) num disparo:
  // alimenta KPIs, hospitais e o seletor sem um round-trip por operadora.
  const { data: overview, dataUpdatedAt: overviewAtualizadoEm } = useDashboardOverview()
  const operadorasLista = useMemo(() => overview?.lista ?? [], [overview])

  // Detalhe (lista de internados) do que está aberto: uma operadora ou, sem
  // operadora, o consolidado — o backend soma os stats e etiqueta cada linha pela
  // operadora dona. Dispara de imediato: o consolidado nunca sai do escopo do usuário.
  const {
    data, isError, isPlaceholderData, isFetching: detalheFetching, dataUpdatedAt: detalheAtualizadoEm,
  } = useDashboard({ operadora, filtro, hospital })
  // Troca de operadora/filtro: com keepPreviousData, os dados ANTERIORES seguem
  // na tela enquanto o novo detalhe carrega (isPlaceholderData). Sem sinal visual,
  // a lista "troca do nada". `trocando` liga um overlay sutil sobre a tabela — o
  // conteúdo atual permanece legível, mas fica claro que há um fetch em curso.
  const trocando = isPlaceholderData && detalheFetching

  // Panorama do que está aberto: a operadora do overview, ou o consolidado dele.
  const consolidado = useMemo(() => consolidarOverview(overview), [overview])
  const ovAtual = todas ? consolidado : overview?.operadoras[operadora]

  // "Atualizar" refaz a Visão Geral INTEIRA (detalhe + KPIs/overview + sidebar),
  // não só a lista — assim os cards do topo e o "N internados" não ficam parados.
  const atualizarTudo = useAtualizarVisaoGeral()
  // Além do botão, as queries revalidam sozinhas (polling + foco — lib/autoRefresh).
  // `sincronizando` = QUALQUER query da tela em voo (automática ou manual) e
  // alimenta o indicador discreto do topo. O botão só mostra "Atualizando…" no
  // clique manual (`atualizandoManual`) — se seguisse `sincronizando`, piscaria e
  // ficaria desabilitado a cada ciclo do polling.
  const fetchingDetalhe = useIsFetching({ queryKey: queryRoots.dashboard })
  const fetchingOverview = useIsFetching({ queryKey: queryRoots.dashboardOverview })
  const fetchingSidebar = useIsFetching({ queryKey: queryRoots.sidebar })
  const sincronizando = fetchingDetalhe + fetchingOverview + fetchingSidebar > 0
  const [atualizandoManual, setAtualizandoManual] = useState(false)
  async function atualizarManual() {
    setAtualizandoManual(true)
    try {
      await atualizarTudo()
    } finally {
      setAtualizandoManual(false)
    }
  }
  // Hora do dado mais recente em tela (panorama ou detalhe) — o que o indicador mostra.
  const atualizadoEm = Math.max(overviewAtualizadoEm, detalheAtualizadoEm)

  // Escopo de dados: `overview.lista` já vem recortado às operadoras que o
  // usuário pode ver. Operadora da URL fora do recorte (?operadora=X, inclusive
  // digitada à mão) → volta à visão consolidada (o backend também zera o payload).
  // Hospital fora do escopo da visão atual (?hospital=Y direto) → limpa o filtro
  // em vez de mostrar vazio sem explicação.
  useEffect(() => {
    if (!overview) return  // espera o recorte chegar para não redirecionar cedo
    const next = new URLSearchParams(params)
    if (operadora && !operadorasLista.some((o) => o.key === operadora)) {
      next.delete('operadora')
      next.delete('hospital')  // hospital da operadora antiga não vale no consolidado
      setParams(next, { replace: true })
      return
    }
    if (hospital && ovAtual && !ovAtual.hospitais.some((h) => h.key === hospital)) {
      next.delete('hospital')
      setParams(next, { replace: true })
    }
  }, [overview, operadorasLista, operadora, hospital, ovAtual, params, setParams])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  // Troca a operadora aberta ('' = consolidado). O hospital filtrado pertence à
  // visão anterior — some junto, para não ficar um recorte inválido na URL.
  function trocarOperadora(key: string) {
    const next = new URLSearchParams(params)
    if (key) next.set('operadora', key)
    else next.delete('operadora')
    next.delete('hospital')
    setParams(next)
  }

  function applyFilter(f: string) {
    const next = new URLSearchParams(params)
    next.set('filtro', filtro === f ? 'todos' : f)
    next.delete('hospital')
    setParams(next)
  }

  // Stats/hospitais/nome vêm do PANORAMA (instantâneo ao trocar de operadora);
  // se o overview ainda não chegou, cai no detalhe. A lista de internados é sempre
  // do detalhe (dado específico do que está aberto).
  const stats = ovAtual?.stats ?? data?.stats ?? {}
  const opNome = ovAtual?.op_nome ?? data?.op_nome ?? (todas ? NOME_TODAS : operadora)
  const hospitaisPanorama = ovAtual?.hospitais ?? data?.hospitais ?? SEM_HOSPITAIS
  const internacoes = data?.internacoes ?? SEM_INTERNACOES
  // Um dos dois já chegou? Governa se KPIs/hospital mostram valor ou skeleton.
  const temPanorama = Boolean(ovAtual || data)

  // No consolidado, os hospitais vão agrupados por operadora (<optgroup>) — o
  // seletor diz de quem é cada hospital. Numa operadora só, lista plana como antes.
  const gruposHospitais = useMemo(() => {
    if (!todas) return null
    const grupos = new Map<string, { nome: string; hospitais: Hospital[] }>()
    for (const h of hospitaisPanorama) {
      const k = h.operadora_key ?? ''
      const g = grupos.get(k) ?? { nome: h.operadora_nome || k || 'Outras', hospitais: [] }
      g.hospitais.push(h)
      grupos.set(k, g)
    }
    return [...grupos.values()]
  }, [todas, hospitaisPanorama])

  // Mapa operadora → hospitais (do panorama, já recortado ao escopo do usuário):
  // alimenta o fluxo operadora→hospital do modal "Adicionar paciente".
  const hospitaisPorOperadora = useMemo(() => {
    const m: Record<string, Hospital[]> = {}
    for (const [key, op] of Object.entries(overview?.operadoras ?? {})) {
      m[key] = op.hospitais
    }
    return m
  }, [overview])

  const visiveis = useMemo(() => {
    const q = busca.toLowerCase().trim()
    const filtrados = internacoes.filter((p) => {
      const nome = (p.nome || '').toLowerCase()
      const atend = String(p.atendimento || '').toLowerCase()
      // A senha entra na busca porque é a identificação exibida na coluna
      // Paciente dos censos sem coluna de nome: buscar só por nome tornaria
      // esses pacientes inencontráveis na própria tela que os lista.
      const senha = (p.senha || '').toLowerCase()
      const okBusca = !q || nome.includes(q) || atend.includes(q) || senha.includes(q)
      const okUti = !utiOn || (p.tipo_leito || '').toUpperCase() === 'UTI'
      const ok30 = !d30On || Number(p.dias || 0) > 30
      // Permanência pelos campos reais (limites por operadora), não por dias>N:
      // '30' = longa_30; '10' = longa_10 (que já inclui os 30+, é o piso).
      const okPerm =
        permanencia === '' ||
        (permanencia === '30' ? Boolean(p.longa_30) : Boolean(p.longa_10))
      return okBusca && okUti && ok30 && okPerm
    })
    if (ordenar === 'sem_rel') {
      // Mais dias sem relatório primeiro; sem relatório (null) vai ao topo.
      return [...filtrados].sort(
        (a, b) => (b.dias_sem_relatorio ?? Infinity) - (a.dias_sem_relatorio ?? Infinity),
      )
    }
    if (ordenar === 'dias') {
      return [...filtrados].sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0))
    }
    return filtrados
  }, [internacoes, busca, utiOn, d30On, permanencia, ordenar])

  // Paginação client-side: renderizar todas as internações de uma vez trava a
  // tabela em operadoras grandes (cada linha tem vários componentes). Fatiamos
  // em páginas e a página some do DOM quando não está visível.
  const POR_PAGINA = 50
  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA))
  // Se a página atual passou do total (filtro reduziu a lista), volta à última válida.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const paginados = useMemo(
    () => visiveis.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [visiveis, paginaAtual],
  )
  // Qualquer mudança de filtro reinicia a paginação na primeira página.
  useEffect(() => {
    setPagina(1)
  }, [busca, utiOn, d30On, permanencia, ordenar, operadora, filtro, hospital])

  const kpis: Array<[string, number, string, string, string]> = [
    ['sem_relatorio', Number(stats.sem_relatorio || 0), 'danger', 'Sem Relatório', 'nunca registrado'],
    ['vencido', Number(stats.relatorio_vencido || 0), 'warning', 'Atrasado', 'passou da janela'],
    ['proximo', Number(stats.proximo_vencer || 0), 'caution', 'Próx. Vencer', 'vence em 1–3 dias'],
    ['em_dia', Number(stats.relatorio_em_dia || 0), 'success', 'Em Dia', 'sem relatório devido'],
    ['todos', Number(stats.total_internados || 0), 'neutral', 'Total Ativos', `${stats.em_monitoramento || 0} em monitoramento`],
  ]

  const actions = (
    <div className="row" style={{ gap: 12 }}>
      <StatusAtualizacao
        atualizadoEm={atualizadoEm}
        sincronizando={sincronizando}
        intervaloMs={AUTO_REFRESH_MS}
      />
      <button className="btn btn-outline btn-sm" onClick={atualizarManual} disabled={atualizandoManual}>
        {atualizandoManual && <Spinner size={13} />}
        {atualizandoManual ? 'Atualizando…' : 'Atualizar'}
      </button>
    </div>
  )

  usePageHeader({
    title: 'Painel Operacional',
    subtitle: (ovAtual || data) ? `${opNome} · ${stats.total_internados || 0} internados · Ref: ${stats.hoje_efetivo || overview?.hoje_efetivo || '—'}` : undefined,
    actions,
  })

  // Uma opção do seletor de hospital (plana ou dentro de um <optgroup>).
  const opcaoHospital = (h: Hospital) => (
    <option key={h.key} value={h.key}>
      {h.nome}
      {h.internados ? `, ${h.internados} internado${h.internados !== 1 ? 's' : ''}` : ''}
      {h.urgente ? ` · ${h.urgente} alerta${h.urgente !== 1 ? 's' : ''}` : ''}
    </option>
  )

  return (
    <>
      {/* Seletor de operadora — 1ª opção é o consolidado (todas as operadoras). */}
      <div className="row" style={{ gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span className={`op-av ${todas ? 'todas' : operadora}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10 }}>
          {todas ? <IconTodas /> : opInitial(operadora)}
        </span>
        <select
          className="bm-input bm-select"
          style={{ width: 'auto', minWidth: 220 }}
          value={operadora}
          onChange={(e) => trocarOperadora(e.target.value)}
        >
          <option value="">{NOME_TODAS}</option>
          {/* Operadora da URL ainda fora da lista (overview não chegou): mantém o
              value válido no <select> até o recorte resolver. */}
          {operadora && !operadorasLista.some((o) => o.key === operadora) && (
            <option value={operadora}>{opNome}</option>
          )}
          {operadorasLista.map((op) => (
            <option key={op.key} value={op.key}>{op.nome}</option>
          ))}
        </select>
        {!todas && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)' }} onClick={() => trocarOperadora('')}>
            Ver todas as operadoras
          </button>
        )}
      </div>

      {/* Carregamento COESO: a tela renderiza o layout inteiro desde o 1º paint.
          Cada bloco mostra seu próprio skeleton até o dado dele chegar — sem
          spinner de tela cheia no meio nem corpo em branco. Só o erro real
          (sem nenhum dado para exibir) troca o layout por uma mensagem. */}
      {isError && !ovAtual && !data ? (
        <div className="empty-state t-danger">Erro ao carregar o painel.</div>
      ) : (
        <>
          {/* KPIs — valores viram skeleton enquanto o panorama não chegou. */}
          <div className="section-label">Controle de Relatórios de Auditoria</div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            {kpis.map(([fkey, val, cls, lbl, meta]) => (
              <div
                key={fkey}
                className={`kpi ${cls}${temPanorama ? ' kpi-clickable' : ''}${filtro === fkey ? ' active-filter' : ''}`}
                onClick={temPanorama ? () => applyFilter(fkey) : undefined}
                aria-busy={!temPanorama}
              >
                <div className="kpi-bar" />
                <div className="kpi-label">{lbl}</div>
                {temPanorama ? (
                  <div className="kpi-value">{val}</div>
                ) : (
                  <div className="kpi-value"><Skeleton w={44} h={26} /></div>
                )}
                {temPanorama ? (
                  <div className="kpi-meta">{meta}</div>
                ) : (
                  <div className="kpi-meta"><Skeleton w={90} h={10} /></div>
                )}
              </div>
            ))}
          </div>

          {/* Seletor de hospital */}
          <div className="section-label" style={{ marginTop: 18 }}>
            {temPanorama
              ? `Hospital: ${hospitaisPanorama.length} unidades cadastradas${todas && operadorasLista.length > 0 ? ` em ${operadorasLista.length} operadoras` : ''}`
              : 'Hospital'}
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 280, maxWidth: 420, flex: 1 }}>
              <select
                className="bm-input bm-select"
                value={hospital}
                onChange={(e) => setParam('hospital', e.target.value || null)}
                disabled={!temPanorama}
              >
                <option value="">
                  {temPanorama ? `Todos os hospitais (${stats.total_internados || 0} internados)` : 'Carregando hospitais…'}
                </option>
                {gruposHospitais
                  ? gruposHospitais.map((g) => (
                      <optgroup key={g.nome} label={g.nome}>{g.hospitais.map(opcaoHospital)}</optgroup>
                    ))
                  : hospitaisPanorama.map(opcaoHospital)}
              </select>
            </div>
            {hospital && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)' }} onClick={() => setParam('hospital', null)}>
                Limpar filtro
              </button>
            )}
          </div>

          {/* Quick filters — os status (Sem relatório/Vencidos) saíram daqui: os
              cards KPI do topo já são o atalho clicável desses status. Estes chips
              cobrem o que a tabela mostra mas o topo não filtra: leito, permanência
              (campos reais longa_10/30) e ordenação por urgência. */}
          <div className="quick-filters" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', flexShrink: 0 }}>Filtros rápidos:</span>
            <span className={`qf-chip${utiOn ? ' active' : ''}`} onClick={() => setUtiOn((v) => !v)}>UTI / CTI</span>
            <span className={`qf-chip${permanencia === '10' ? ' active' : ''}`} onClick={() => setPermanencia((v) => (v === '10' ? '' : '10'))}>
              Longa 10d+
            </span>
            <span className={`qf-chip${permanencia === '30' ? ' active' : ''}`} onClick={() => setPermanencia((v) => (v === '30' ? '' : '30'))}>
              Longa 30d+
            </span>
            <span className={`qf-chip${d30On ? ' active' : ''}`} onClick={() => setD30On((v) => !v)}>&gt; 30 dias</span>
            <select
              className="bm-input bm-select"
              style={{ width: 'auto', minWidth: 180 }}
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as '' | 'sem_rel' | 'dias')}
              title="Ordenar a lista"
            >
              <option value="">Ordenar: padrão</option>
              <option value="sem_rel">Mais dias sem relatório</option>
              <option value="dias">Mais dias internado</option>
            </select>
            {(utiOn || d30On || permanencia !== '' || ordenar !== '') && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--muted)' }}
                onClick={() => { setUtiOn(false); setD30On(false); setPermanencia(''); setOrdenar('') }}
              >
                Limpar
              </button>
            )}
            <div style={{ flex: 1 }} />
            <input
              type="text"
              className="bm-input"
              style={{ width: 260 }}
              placeholder="Buscar segurado, atendimento…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {/* Tabela — bloco pesado adiado para depois do primeiro paint dos KPIs
              e filtros. Enquanto o detalhe (data) não chegou, mostra um skeleton
              de tabela com a MESMA moldura (card + linhas) do conteúdo real, para
              não haver salto de layout nem um segundo spinner. */}
          {data ? (
            <Deferred
              delaySteps={2}
              minHeight={360}
              placeholder={<TabelaSkeleton />}
            >
              {/* Wrapper com overlay de troca: durante a troca de operadora/filtro,
                  os dados anteriores seguem visíveis (esmaecidos) sob um overlay
                  com spinner, em vez de trocarem "do nada". */}
              <div style={{ position: 'relative' }} aria-busy={trocando}>
                <div style={trocando ? { opacity: 0.45, transition: 'opacity .15s', pointerEvents: 'none' } : undefined}>
                  <InternadosTable
                    paginados={paginados}
                    totalVisiveis={visiveis.length}
                    totalInternacoes={internacoes.length}
                    totalBackend={stats.total_internados || 0}
                    paginaAtual={paginaAtual}
                    totalPaginas={totalPaginas}
                    porPagina={POR_PAGINA}
                    mostrarOperadora={todas}
                    onExportar={() => setExportOpen(true)}
                    onAdicionarPaciente={somenteLeitura ? undefined : () => setAddOpen(true)}
                    onSelecionar={setDrawerId}
                    onSelecionarHospital={setHospitalFicha}
                    onPrefetch={prefetchPaciente}
                    onPrev={() => setPagina((p) => Math.max(1, p - 1))}
                    onNext={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  />
                </div>
                {trocando && (
                  <div
                    style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'flex-start', justifyContent: 'center',
                      paddingTop: 120, pointerEvents: 'none',
                    }}
                  >
                    <div
                      className="row"
                      style={{
                        gap: 10, alignItems: 'center', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: 999,
                        padding: '8px 16px', boxShadow: '0 4px 16px rgba(6,46,92,.12)',
                        fontSize: 'var(--t-sm)', color: 'var(--muted)',
                      }}
                    >
                      <Spinner size={15} />
                      {todas ? 'Carregando todas as operadoras…' : `Carregando ${opNome}…`}
                    </div>
                  </div>
                )}
              </div>
            </Deferred>
          ) : (
            <TabelaSkeleton />
          )}
        </>
      )}

      {hospitalFicha && (
        <HospitalDetalhesModal
          hospital={hospitalFicha}
          onClose={() => setHospitalFicha(null)}
          // O atalho para a ficha editável só aparece para quem tem a tela:
          // os papéis operacionais deste painel não veem Configurações.
          onAbrirCadastro={
            podeVer(role, 'configuracoes')
              ? (key) => { setHospitalFicha(null); navigate(`/configuracoes?hospital=${encodeURIComponent(key)}`) }
              : undefined
          }
        />
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => {
            setDrawerId(null)
            setToast(msg)
            // Salvar um relatório muda também os KPIs e as contagens da sidebar,
            // não só a lista — atualiza a Visão Geral inteira.
            atualizarTudo()
          }}
        />
      )}
      {addOpen && (
        <AddPacienteModal
          operadoras={operadorasLista}
          hospitaisPorOperadora={hospitaisPorOperadora}
          operadoraInicial={operadora || undefined}
          hospitalInicial={hospital || undefined}
          onClose={() => setAddOpen(false)}
          onDone={(msg) => { setAddOpen(false); setToast(msg) }}
          onError={(msg) => setToast(msg)}
        />
      )}
      {exportOpen && (
        <ExportarModal
          operadora={operadora}
          operadoraNome={opNome}
          somenteTodas={todas}
          onClose={() => setExportOpen(false)}
          onError={(msg) => setToast(msg)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
