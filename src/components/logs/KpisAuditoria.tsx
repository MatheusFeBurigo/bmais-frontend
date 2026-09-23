// Linha de KPIs da tela de Movimentações (apresentação pura): totais do período.
import { KpiCard, Skeleton } from '../ui'
import type { AuditoriaTotais } from '../../types/api'
import { contarCadastros } from './logs.model'

export default function KpisAuditoria({ totais, periodoLabel, carregando }: {
  totais?: AuditoriaTotais
  periodoLabel: string
  carregando: boolean
}) {
  if (carregando && !totais) {
    return (
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi neutral"><Skeleton w={80} h={10} /><Skeleton w={48} h={24} style={{ marginTop: 8 }} /></div>
        ))}
      </div>
    )
  }
  const t = totais
  const ent = t?.por_entidade ?? {}
  const cadastros = contarCadastros(ent)
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
      <KpiCard variant="primary-kpi" label={`Movimentações · ${periodoLabel}`} value={t?.acoes ?? 0}
        meta={`${t?.hoje ?? 0} hoje`} />
      <KpiCard variant="info" label="Relatórios" value={ent.relatorio ?? 0}
        meta="registrados por usuários" />
      <KpiCard variant="success" label="Censos" value={ent.censo ?? 0}
        meta="envios, processamentos e complementos" />
      <KpiCard variant="caution" label="Cadastros" value={cadastros}
        meta={`${ent.usuario ?? 0} em usuários de acesso`} />
      <KpiCard variant={t && t.erros > 0 ? 'danger' : 'neutral'} label="Falhas / negadas" value={t?.erros ?? 0}
        meta={`${t?.negados ?? 0} barradas por permissão`} />
    </div>
  )
}
