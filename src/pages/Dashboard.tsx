import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import { LoadingState, Spinner, opInitial } from '../components/ui'
import { Deferred } from '../components/Deferred'
import InternadosTable from '../components/internados/InternadosTable'
import { useDashboard, useDashboardOverview } from '../hooks/useDashboard'
import { exportarRvm } from '../services/dashboard.service'

export default function Dashboard() {
  const [params, setParams] = useSearchParams()
  const operadora = params.get('operadora') || 'sulamerica'
  const filtro = params.get('filtro') || 'todos'
  const hospital = params.get('hospital') || ''

  // Filtros client-side
  const [busca, setBusca] = useState('')
  const [utiOn, setUtiOn] = useState(false)
  const [d30On, setD30On] = useState(false)
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  async function exportar() {
    try {
      await exportarRvm(operadora)
    } catch {
      setToast('Falha ao exportar')
    }
  }

  // Detalhe (lista de internados) da operadora aberta — dado pesado/específico.
  const { data, isLoading, isError, refetch, isFetching } = useDashboard({ operadora, filtro, hospital })

  // Panorama de TODAS as operadoras num disparo: alimenta KPIs, hospitais e o
  // seletor de QUALQUER operadora sem um novo round-trip ao trocar. A fatia da
  // operadora atual sai daqui — instantânea assim que o overview está em cache.
  const { data: overview } = useDashboardOverview()
  const ovAtual = overview?.operadoras[operadora]
  const operadorasLista = overview?.lista ?? []

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
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
  // do detalhe (dado específico da operadora aberta).
  const stats = ovAtual?.stats ?? data?.stats ?? {}
  const opNome = ovAtual?.op_nome ?? data?.op_nome ?? operadora
  const hospitaisPanorama = ovAtual?.hospitais ?? data?.hospitais ?? []
  const internacoes = data?.internacoes ?? []

  const visiveis = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return internacoes.filter((p) => {
      const nome = (p.nome || '').toLowerCase()
      const atend = String(p.atendimento || '').toLowerCase()
      const okBusca = !q || nome.includes(q) || atend.includes(q)
      const okUti = !utiOn || (p.tipo_leito || '').toUpperCase() === 'UTI'
      const ok30 = !d30On || Number(p.dias || 0) > 30
      return okBusca && okUti && ok30
    })
  }, [internacoes, busca, utiOn, d30On])

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
  }, [busca, utiOn, d30On, operadora, filtro, hospital])

  const kpis: Array<[string, number, string, string, string]> = [
    ['sem_relatorio', Number(stats.sem_relatorio || 0), 'danger', 'Sem Relatório', 'nunca registrado'],
    ['vencido', Number(stats.relatorio_vencido || 0), 'warning', 'Atrasado', 'passou da janela'],
    ['proximo', Number(stats.proximo_vencer || 0), 'caution', 'Próx. Vencer', 'vence em 1–3 dias'],
    ['em_dia', Number(stats.relatorio_em_dia || 0), 'success', 'Em Dia', 'dentro da janela'],
    ['todos', Number(stats.total_internados || 0), 'neutral', 'Total Ativos', `${stats.em_monitoramento || 0} em monitoramento`],
  ]

  const actions = (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => refetch()} disabled={isFetching}>
        {isFetching && <Spinner size={13} />}
        {isFetching ? 'Atualizando…' : 'Atualizar'}
      </button>
      <button className="btn btn-primary btn-sm" onClick={exportar}>
        Exportar
      </button>
    </>
  )

  return (
    <Layout
      title="Painel Operacional"
      subtitle={(ovAtual || data) ? `${opNome} · ${stats.total_internados || 0} internados · Ref: ${stats.hoje_efetivo || overview?.hoje_efetivo || '—'}` : undefined}
      actions={actions}
    >
      {/* Seletor de operadora */}
      <div className="row" style={{ gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span className={`op-av ${operadora}`} style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10 }}>
          {opInitial(operadora)}
        </span>
        <select
          className="bm-input bm-select"
          style={{ width: 'auto', minWidth: 220 }}
          value={operadora}
          onChange={(e) => setParam('operadora', e.target.value)}
        >
          {operadorasLista.length === 0 && <option value={operadora}>{opNome}</option>}
          {operadorasLista.map((op) => (
            <option key={op.key} value={op.key}>{op.nome}</option>
          ))}
        </select>
      </div>

      {/* Só bloqueia com loading quando NEM o panorama NEM o detalhe chegaram. */}
      {isLoading && !ovAtual && <LoadingState label="Carregando painel…" />}
      {isError && !ovAtual && <div className="empty-state t-danger">Erro ao carregar o painel.</div>}

      {(ovAtual || data) && (
        <>
          {/* KPIs */}
          <div className="section-label">Controle de Relatórios de Auditoria</div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            {kpis.map(([fkey, val, cls, lbl, meta]) => (
              <div
                key={fkey}
                className={`kpi ${cls} kpi-clickable${filtro === fkey ? ' active-filter' : ''}`}
                onClick={() => applyFilter(fkey)}
              >
                <div className="kpi-bar" />
                <div className="kpi-label">{lbl}</div>
                <div className="kpi-value">{val}</div>
                <div className="kpi-meta">{meta}</div>
              </div>
            ))}
          </div>

          {/* Seletor de hospital */}
          <div className="section-label" style={{ marginTop: 18 }}>
            Hospital — {hospitaisPanorama.length} unidades cadastradas
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 280, maxWidth: 420, flex: 1 }}>
              <select
                className="bm-input bm-select"
                value={hospital}
                onChange={(e) => setParam('hospital', e.target.value || null)}
              >
                <option value="">Todos os hospitais ({stats.total_internados || 0} internados)</option>
                {hospitaisPanorama.map((h) => (
                  <option key={h.key} value={h.key}>
                    {h.nome}
                    {h.internados ? ` — ${h.internados} internado${h.internados !== 1 ? 's' : ''}` : ''}
                    {h.urgente ? ` · ${h.urgente} alerta${h.urgente !== 1 ? 's' : ''}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {hospital && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)' }} onClick={() => setParam('hospital', null)}>
                Limpar filtro
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div className="quick-filters" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', flexShrink: 0 }}>Filtros rápidos:</span>
            <span className={`qf-chip${filtro === 'sem_relatorio' ? ' active' : ''}`} onClick={() => applyFilter('sem_relatorio')}>
              Sem relatório{filtro === 'sem_relatorio' && ' ×'}
            </span>
            <span className={`qf-chip${filtro === 'vencido' ? ' active' : ''}`} onClick={() => applyFilter('vencido')}>
              Vencidos{filtro === 'vencido' && ' ×'}
            </span>
            <span className={`qf-chip${utiOn ? ' active' : ''}`} onClick={() => setUtiOn((v) => !v)}>UTI / CTI</span>
            <span className={`qf-chip${d30On ? ' active' : ''}`} onClick={() => setD30On((v) => !v)}>&gt; 30 dias</span>
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
              e filtros; o cliente vê os números e controles imediatamente. */}
          <Deferred
            delaySteps={2}
            minHeight={360}
            placeholder={<LoadingState label="Carregando internados…" style={{ minHeight: 360 }} />}
          >
          <InternadosTable
            paginados={paginados}
            totalVisiveis={visiveis.length}
            totalInternacoes={internacoes.length}
            totalBackend={stats.total_internados || 0}
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            porPagina={POR_PAGINA}
            onExportar={exportar}
            onSelecionar={setDrawerId}
            onPrev={() => setPagina((p) => Math.max(1, p - 1))}
            onNext={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          />
          </Deferred>
        </>
      )}

      {drawerId != null && (
        <PacienteDrawer
          internacaoId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(msg) => {
            setDrawerId(null)
            setToast(msg)
            refetch()
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Layout>
  )
}
