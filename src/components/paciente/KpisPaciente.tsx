// Cartões de KPI do topo da ficha do paciente.
import { corDaGravidade, gravidadeDoStatus, KPI_PERIGO } from '../../lib/statusRelatorio'
import { dataBR } from '../../lib/datas'
import type { InternacaoDados } from '../../types/api'

function LeitoGrande({ tipo }: { tipo?: string | null }) {
  const sigla = tipo === 'UTI' ? 'UTI' : tipo === 'APARTAMENTO' ? 'APT' : tipo === 'ENFERMARIA' ? 'ENF' : null
  if (!sigla) return <span style={{ fontSize: 'var(--t-md)', color: 'var(--muted-2)' }}>—</span>
  return <span className={`leito ${tipo}`} style={{ fontSize: 13, padding: '4px 10px' }}>{sigla}</span>
}

export function KpisPaciente({ d }: { d: InternacaoDados }) {
  const gravidade = gravidadeDoStatus(d.status_relatorio)
  const perigo = gravidade === 'perigo'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
      <div className="dk">
        <div className="dk-bar" style={{ background: perigo ? 'var(--danger)' : 'var(--ink-2)' }} />
        <div className="dk-label">Dias internado</div>
        <div className="dk-value">{d.dias ?? '—'}</div>
        <div className="dk-meta">gatilho: {d.gatilho ?? '—'}d</div>
      </div>
      <div className="dk">
        <div className="dk-label">Tipo de leito</div>
        <div style={{ marginTop: 4 }}><LeitoGrande tipo={d.tipo_leito} /></div>
        <div className="dk-meta">leito {d.leito_codigo || 'n/a'}</div>
      </div>
      <div className="dk" style={perigo ? KPI_PERIGO.cartao : undefined}>
        <div className="dk-bar" style={{ background: corDaGravidade(gravidade) }} />
        <div className="dk-label" style={perigo ? KPI_PERIGO.texto : undefined}>Última visita</div>
        <div className="dk-value" style={{ fontSize: 'var(--t-lg)', ...(perigo ? KPI_PERIGO.texto : {}) }}>
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
  )
}
