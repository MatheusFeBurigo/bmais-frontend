// Esqueleto de carregamento do Painel Operacional. Replica a MOLDURA da tela
// (seletor de operadora + KPIs + filtros + tabela) com shimmer, para que o
// carregamento seja um único visual contínuo:
//   1) fallback do Suspense enquanto o chunk lazy do Dashboard baixa;
//   2) dentro do Dashboard, enquanto o panorama/detalhe ainda não chegaram.
// Assim não há "dois carregamentos" (spinner do chunk → skeleton dos dados):
// é o mesmo esqueleto do começo ao fim.

import { Skeleton } from '../ui'

// Esqueleto só da tabela de internados (card + cabeçalho + linhas). Reusado como
// placeholder do bloco pesado (Deferred) e no gap "sem detalhe ainda".
export function TabelaSkeleton() {
  return (
    <div className="card" style={{ marginTop: 14 }} aria-busy="true">
      <div className="card-header" style={{ alignItems: 'center', paddingBottom: 14 }}>
        <div>
          <div className="card-title">Todos os Internados</div>
          <div className="card-sub"><Skeleton w={160} h={12} /></div>
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Skeleton w={84} h={30} radius={8} />
          <Skeleton w={150} h={30} radius={8} />
        </div>
      </div>
      <div style={{ padding: '4px 20px 16px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 0', borderTop: i ? '1px solid var(--border)' : undefined }}
          >
            <Skeleton w={92} h={20} radius={999} />
            <Skeleton w={140} h={13} />
            <Skeleton w={200} h={13} style={{ flex: 1 }} />
            <Skeleton w={70} h={13} />
            <Skeleton w={46} h={20} radius={6} />
            <Skeleton w={72} h={13} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Esqueleto da tela inteira. Usado como fallback do Suspense do Dashboard, para
// o download do chunk já mostrar a moldura final em vez de um spinner solto.
export default function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      {/* Seletor de operadora */}
      <div className="row" style={{ gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <Skeleton w={26} h={26} radius={7} />
        <Skeleton w={220} h={32} radius={8} />
      </div>

      {/* KPIs */}
      <div className="section-label">Controle de Relatórios de Auditoria</div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="kpi neutral">
            <div className="kpi-bar" />
            <div className="kpi-label"><Skeleton w={80} h={10} /></div>
            <div className="kpi-value"><Skeleton w={44} h={26} /></div>
            <div className="kpi-meta"><Skeleton w={90} h={10} /></div>
          </div>
        ))}
      </div>

      {/* Seletor de hospital */}
      <div className="section-label" style={{ marginTop: 18 }}>Hospital</div>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 280, maxWidth: 420, flex: 1 }}>
          <Skeleton w="100%" h={34} radius={8} />
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="quick-filters" style={{ marginTop: 14 }}>
        <Skeleton w={80} h={13} />
        <Skeleton w={96} h={26} radius={999} />
        <Skeleton w={80} h={26} radius={999} />
        <Skeleton w={78} h={26} radius={999} />
        <div style={{ flex: 1 }} />
        <Skeleton w={260} h={32} radius={8} />
      </div>

      <TabelaSkeleton />
    </div>
  )
}
