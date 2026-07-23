// Card de fluxo (acordeão) do Gestor: seleção de período via gráfico.
// · Aberto: header (título + janela + seletor de data + recolher) e os dois
//   gráficos de fluxo (ocupação + fluxo diário). Clicar numa coluna ancora o
//   painel no PERÍODO daquela coluna: 1 dia em 30d/90d, a semana em 6m, o mês
//   em 1a. O backend expõe `ini`/`fim` de cada coluna (bucket).
// · Colapsado: barra full-width que expande + o período analisado abaixo.
// Extraído de pages/Gestor.tsx — apresentação pura, dirigida por props/callbacks.
import type { GestorMetrics, SerieDia } from '../../types/api'
import { JANELAS } from './gestor.model'
import { OcupacaoChart, FluxoDiarioChart } from './charts'
import DiaChip from './DiaChip'

export interface FluxoCardProps {
  m: GestorMetrics
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  janelaTitulo: string
  /** Um recorte temporal (dia OU intervalo) está ativo — controla o colapso e o chip. */
  periodoAtivo: boolean
  fJanela: string
  onJanela: (janela: string) => void
  /** Clique numa coluna: ancora o painel no período (bucket) clicado. */
  onBucket: (item: SerieDia) => void
  /** Seletor de data (dia único) — limpa o intervalo. */
  onData: (data: string) => void
  /** Volta ao período completo (modo geral): limpa dia e intervalo. */
  onLimparPeriodo: () => void
}

export default function FluxoCard({
  m, aberto, onAbertoChange, janelaTitulo, periodoAtivo, fJanela, onJanela, onBucket, onData, onLimparPeriodo,
}: FluxoCardProps) {
  if (aberto) {
    // Clicar numa coluna ancora o painel no período dela e colapsa o gráfico.
    const onBucketClick = (item: SerieDia) => { onBucket(item); onAbertoChange(false) }
    return (
      <div className="chart-card chart-reveal" key="aberto" style={{ marginBottom: 16 }}>
        <div className="chart-head-row">
          <div className="chart-head-txt chart-head-inline">
            <span className="chart-title">Fluxo dos {janelaTitulo}</span>
            <span className="chart-head-sub">
              Clique num período no gráfico ou escolha a data ao lado
            </span>
          </div>
          {/* Seletor de janela: período/agrupamento do gráfico de fluxo. */}
          <div className="janela-pills">
            {JANELAS.map((j) => (
              <button key={j.key} type="button"
                className={`pill-janela${fJanela === j.key ? ' active' : ''}`}
                onClick={() => onJanela(j.key === '30d' ? '' : j.key)}>
                {j.pill}
              </button>
            ))}
          </div>
          {/* Volta ao período completo: limpa dia/intervalo → sem destaque,
              médias e KPIs voltam ao geral. Só aparece com um período ativo. */}
          {periodoAtivo && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onLimparPeriodo}>
              Ver todo o período
            </button>
          )}
          <input
            type="date"
            className="bm-input chart-date"
            value={m.dia}
            onChange={(e) => onData(e.target.value)}
            aria-label="Selecionar dia"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm chart-toggle"
            onClick={() => onAbertoChange(false)}
            aria-expanded
          >
            <svg className="chart-chevron aberto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            Recolher
          </button>
        </div>
        {/* Ocupação (ESTOQUE): quantos leitos ocupados por dia. */}
        <div className="sub-chart-lbl" style={{ marginTop: 18 }}>Ocupação · internados por dia</div>
        <div style={{ height: 210, marginTop: 8 }}>
          <OcupacaoChart m={m} periodoAtivo={periodoAtivo} onBucket={onBucketClick} />
        </div>
        <div className="sub-chart-sep" />
        {/* Fluxo diário (FLUXO): entradas vs altas + saldo do dia. */}
        <div className="sub-chart-lbl">Fluxo diário · entradas, altas e saldo</div>
        <div style={{ height: 190, marginTop: 8 }}>
          <FluxoDiarioChart m={m} periodoAtivo={periodoAtivo} onBucket={onBucketClick} />
        </div>
      </div>
    )
  }

  return (
    <div className="chart-reveal" key="colapsado" style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="chart-expand-bar"
        onClick={() => onAbertoChange(true)}
        aria-expanded={false}
      >
        <span className="chart-expand-txt">
          <b>Fluxo dos {janelaTitulo}</b>
          <span>Período analisado abaixo · expandir para navegar</span>
        </span>
        <span className="chart-expand-cta">
          Expandir gráfico
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {/* Período selecionado — FORA da barra, logo abaixo do gráfico recolhido.
          Ao lado, um atalho para voltar ao período completo. */}
      {periodoAtivo && (
        <div className="dia-abaixo">
          <span className="dia-abaixo-lbl">Analisando o período</span>
          <DiaChip label={m.dia_label} onRemove={onLimparPeriodo} />
          <button type="button" className="btn btn-primary btn-sm" onClick={onLimparPeriodo}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            Ver todo o período
          </button>
        </div>
      )}
    </div>
  )
}
