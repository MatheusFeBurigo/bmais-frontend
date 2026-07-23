import { useState } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { KpiCard, LoadingState } from '../components/ui'
import PacienteDrawer from '../components/PacienteDrawer'
import Toast from '../components/Toast'
import { Deferred } from '../components/Deferred'
import { usePrefetchInternacao } from '../hooks/useInternacao'
import { useGestorView } from '../hooks/useGestorView'
import { localStyles, COR } from '../components/gestor/gestor.styles'
import { OperadoraPills, ChipsAtivos } from '../components/gestor/FiltrosBar'
import FluxoCard from '../components/gestor/FluxoCard'
import MediasJanelaCard from '../components/gestor/MediasJanelaCard'
import TabelaPacientes from '../components/gestor/TabelaPacientes'
import { FaixasDonut, HospBar, RegBar } from '../components/gestor/charts'

export default function Gestor() {
  const [drawerId, setDrawerId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const prefetchPaciente = usePrefetchInternacao()

  const v = useGestorView()
  const { m, filtros } = v

  usePageHeader({ title: 'Painel do Gestor', subtitle: v.subtitle })

  return (
    <>
      <style>{localStyles}</style>

      {/* Barra de filtro no topo — operadora como pills (filtro GLOBAL: refaz a
          busca, afetando todo o painel; hospital/região vêm dos cliques nos gráficos). */}
      {m && filtros && (
        <OperadoraPills
          operadoras={filtros.operadoras}
          ativa={v.fOperadora}
          onSelecionar={(key) => v.setFiltro({ operadora: key, hospital: '' })}
        />
      )}

      {/* Filtros ativos: chips removíveis individualmente + "Limpar tudo". */}
      <ChipsAtivos chips={v.chipsFiltros} onLimparTudo={v.limparTudo} />

      {v.isLoading && <LoadingState label="Carregando painel…" />}
      {v.isError && <div className="empty-state t-danger">Erro ao carregar o painel.</div>}

      {m && (
        <div className={`gestor-conteudo${v.atualizando ? ' atualizando' : ''}`}>
          {/* KPIs do dia (clicáveis → filtram a lista) */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
            <KpiCard variant="primary-kpi"
              label={v.periodoAtivo ? `Internados${v.sufixoDia}` : 'Internados até o momento'}
              value={m.hoje.internados}
              meta={v.modoIntervalo ? `ativos ao fim de ${m.dia_label}` : v.diaHistorico ? `total ativo em ${m.dia_label}` : 'total ativo agora'}
              active={v.faixa === ''} onClick={() => v.toggleFaixa('')} />
            <KpiCard variant="info" label="Até 9 dias" value={m.hoje.f0_9}
              meta="permanência curta" active={v.faixa === '0_9'} onClick={() => v.toggleFaixa('0_9')} />
            <KpiCard variant="warning" label="10 a 29 dias" value={m.hoje.f10_29}
              meta="permanência prolongada" active={v.faixa === '10_29'} onClick={() => v.toggleFaixa('10_29')} />
            <KpiCard variant="danger" label="30+ dias" value={m.hoje.f30}
              meta="permanência crítica" active={v.faixa === '30p'} onClick={() => v.toggleFaixa('30p')} />
            <KpiCard variant="success"
              label={v.modoIntervalo ? 'Altas no período' : v.diaHistorico ? `Altas${v.sufixoDia}` : 'Altas do Dia'}
              value={m.hoje.altas}
              meta={`${m.hoje.entradas} ${v.modoIntervalo ? 'entradas no período' : 'novas entradas'}`}
              active={v.faixa === 'altas'} onClick={() => v.toggleFaixa('altas')} />
          </div>

          {/* Gráficos + tabela adiados para depois do primeiro paint dos KPIs —
              o cliente vê os números do dia imediatamente. */}
          <Deferred
            delaySteps={2}
            minHeight={560}
            placeholder={<LoadingState label="Carregando gráficos…" style={{ minHeight: 560 }} />}
          >
          <FluxoCard
            m={m}
            aberto={v.graficoAberto}
            onAbertoChange={v.setGraficoAberto}
            janelaTitulo={v.janelaTitulo}
            periodoAtivo={v.periodoAtivo}
            fJanela={v.fJanela}
            onJanela={(janela) => v.setFiltro({ janela })}
            // Clique numa coluna: bucket de 1 dia (30d/90d) vira `data`; bucket
            // agrupado (semana/mês) vira intervalo [ini,fim].
            onBucket={(item) => item.ini === item.fim ? v.setDia(item.dia) : v.setPeriodo(item.ini, item.fim)}
            onData={(data) => v.setDia(data)}
            onLimparPeriodo={() => v.setFiltro({ data: '', inicio: '', fim: '' })}
          />

          {/* Médias do período da JANELA selecionada. Só no modo geral; ao
              analisar um período específico não se aplicam (são agregados). */}
          {!v.periodoAtivo && m.media_janela && (
            <div className="chart-reveal" style={{ marginBottom: 16 }}>
              <MediasJanelaCard media={m.media_janela} janelaTitulo={v.janelaTitulo} />
            </div>
          )}

          {/* Permanência (donut) + Internados por hospital + por região. */}
          <div style={{ display: 'grid', gridTemplateColumns: m.por_regiao.length > 1 ? '320px 1fr 1fr' : '320px 1fr', gap: 16, marginBottom: 16 }}>
            <div className="chart-card">
              <div className="chart-title">Permanência por período</div>
              <div className="chart-hint">Clique numa faixa para listar os internados dela abaixo</div>
              <div style={{ height: 300 }}>
                <FaixasDonut m={m} onFaixa={(f) => v.toggleFaixa(f)} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">
                Internados por hospital{v.nomeOpFiltrada && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {v.nomeOpFiltrada}</span>}
              </div>
              <div className="chart-hint">
                {v.nomeOpFiltrada
                  ? `Principais hospitais de ${v.nomeOpFiltrada} · clique numa barra para filtrar`
                  : 'Clique numa barra para filtrar; clique de novo para desfazer'}
              </div>
              <div style={{ height: 300 }}>
                <HospBar m={m} selKey={v.fHospital} onHosp={(key) => v.setFiltro({ hospital: key === v.fHospital ? '' : key })} />
              </div>
            </div>
            {m.por_regiao.length > 1 && (
              <div className="chart-card">
                <div className="chart-title">Internados por região</div>
                <div className="chart-hint">Clique numa barra para filtrar; clique de novo para desfazer</div>
                <div style={{ height: 300 }}>
                  <RegBar m={m} selNome={v.fRegiao} onReg={(nome) => v.setFiltro({ regiao: nome === v.fRegiao ? '' : nome })} />
                </div>
              </div>
            )}
          </div>

          {/* Lista de pacientes — pills de filtro JUNTO da tabela (evita "pulo"
              de scroll: nada de altura variável fica abaixo dos pills clicados). */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                Pacientes {v.modoIntervalo ? `do período (${m.dia_label})` : v.diaHistorico ? `de ${m.dia_label}` : 'internados'}
                {v.nomeHospFiltrado && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {v.nomeHospFiltrado}</span>}
                {' · '}<span>{v.visiveis.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`pill-faixa${v.faixa === '' ? ' active' : ''}`} onClick={() => v.toggleFaixa('')}>Todos</span>
                <span className={`pill-faixa${v.faixa === '0_9' ? ' active' : ''}`} onClick={() => v.toggleFaixa('0_9')}><span className="faixa-dot" style={{ background: COR.azul }} />Até 9d</span>
                <span className={`pill-faixa${v.faixa === '10_29' ? ' active' : ''}`} onClick={() => v.toggleFaixa('10_29')}><span className="faixa-dot" style={{ background: COR.laranja }} />10–29d</span>
                <span className={`pill-faixa${v.faixa === '30p' ? ' active' : ''}`} onClick={() => v.toggleFaixa('30p')}><span className="faixa-dot" style={{ background: COR.vermelho }} />30+d</span>
                <span className={`pill-faixa${v.faixa === 'altas' ? ' active' : ''}`} onClick={() => v.toggleFaixa('altas')}><span className="faixa-dot" style={{ background: COR.verde }} />Altas</span>
              </div>
            </div>
            <TabelaPacientes pacientes={v.visiveis} onSelecionar={setDrawerId} onPrefetch={prefetchPaciente} vazio={v.modoIntervalo ? 'Nenhum paciente neste período' : v.diaHistorico ? 'Nenhum paciente neste dia' : 'Nenhum paciente internado'} />
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
