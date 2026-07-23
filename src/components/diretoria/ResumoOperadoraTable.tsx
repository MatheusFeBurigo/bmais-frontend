// Tabela "Resumo por Operadora" da Diretoria + seletor de export por operadora.
// Apresentação pura — o estado do seletor e a ação de export vêm por props.
// Extraído de pages/Diretoria.tsx.
import type { DiretoriaPayload } from '../../types/api'
import { OpAvatar, ProgressBar } from '../ui'

export default function ResumoOperadoraTable({ data, expOp, onExpOp, onExportar }: {
  data: DiretoriaPayload
  expOp: string
  onExpOp: (key: string) => void
  onExportar: () => void
}) {
  const ops = data.por_operadora || []
  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Resumo por Operadora</div>
          <p className="card-sub">Dados consolidados para todas as operadoras ativas</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select
            className="bm-input bm-select"
            style={{ fontSize: 'var(--t-sm)' }}
            value={expOp}
            onChange={(e) => onExpOp(e.target.value)}
            title="Operadora a exportar (planilha por operadora)"
          >
            <option value="">Operadora…</option>
            {ops.map((o) => (
              <option key={o.key} value={o.key}>{o.nome}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={onExportar} disabled={!expOp}>Exportar</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="bmais-table">
          <thead>
            <tr>
              <th>Operadora</th>
              <th className="t-right">Internados</th>
              <th className="t-right">Em Mon.</th>
              <th className="t-right" style={{ color: 'var(--danger)' }}>Sem Rel.</th>
              <th className="t-right" style={{ color: 'var(--warning)' }}>Vencido</th>
              <th className="t-right" style={{ color: 'var(--caution)' }}>Próx.</th>
              <th className="t-right" style={{ color: 'var(--success)' }}>Em Dia</th>
              <th style={{ minWidth: 140 }}>SLA</th>
              <th className="t-right">L.10</th>
              <th className="t-right">L.30</th>
              <th className="t-right">Altas</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((op) => {
              const sla = op.sla || 0
              const low = sla < 50
              return (
                <tr key={op.key}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <OpAvatar opKey={op.key} size={28} />
                      <div>
                        <div className="fw-6" style={{ fontSize: 'var(--t-base)' }}>{op.nome}</div>
                        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>janela: {op.janela_relatorio ? `${op.janela_relatorio}d` : '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="t-right mono fw-6">{op.internados || 0}</td>
                  <td className="t-right mono t-muted">{op.em_monitoramento || 0}</td>
                  <td className={`t-right mono ${(op.sem_relatorio || 0) > 0 ? 't-danger fw-6' : 't-muted'}`}>{(op.sem_relatorio || 0) > 0 ? op.sem_relatorio : '—'}</td>
                  <td className={`t-right mono ${(op.relatorio_vencido || 0) > 0 ? 't-warning fw-6' : 't-muted'}`}>{(op.relatorio_vencido || 0) > 0 ? op.relatorio_vencido : '—'}</td>
                  <td className="t-right mono t-muted">{op.proximo_vencer || '—'}</td>
                  <td className={`t-right mono ${(op.relatorio_em_dia || 0) > 0 ? 't-success fw-6' : 't-muted'}`}>{(op.relatorio_em_dia || 0) > 0 ? op.relatorio_em_dia : '—'}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar pct={sla} color={low ? 'var(--danger)' : 'var(--success)'} />
                      </div>
                      <span className="mono fw-6" style={{ fontSize: 12, color: low ? 'var(--danger)' : 'var(--success)' }}>{sla}%</span>
                    </div>
                  </td>
                  <td className="t-right mono">{op.longa_permanencia || '—'}</td>
                  <td className="t-right mono">{op.longa_avancada || '—'}</td>
                  <td className="t-right mono">
                    {op.total_altas || 0}
                    {(op.total_altas || 0) > 0 && <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 3 }}>({op.total_altas}↑)</span>}
                  </td>
                  <td style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>{op.responsaveis || '—'}</td>
                </tr>
              )
            })}
            {/* Total geral */}
            <tr style={{ background: 'var(--surface-3)' }}>
              <td><strong style={{ letterSpacing: '.08em', fontSize: 11, textTransform: 'uppercase' }}>Total geral</strong></td>
              <td className="t-right mono fw-7">{data.total_internados || 0}</td>
              <td className="t-right mono fw-6">{data.em_monitoramento || 0}</td>
              <td className="t-right mono fw-7 t-danger">{data.sem_relatorio || 0}</td>
              <td className="t-right mono fw-6 t-warning">{data.relatorio_vencido || 0}</td>
              <td className="t-right mono">{data.proximo_vencer || '—'}</td>
              <td className="t-right mono fw-6 t-success">{data.relatorio_em_dia || 0}</td>
              <td className={`mono fw-6 ${(data.sla_global || 0) < 50 ? 't-danger' : 't-success'}`}>{data.sla_global || 0}%</td>
              <td className="t-right mono">{data.longa_permanencia || 0}</td>
              <td className="t-right mono">{data.longa_avancada || 0}</td>
              <td className="t-right mono">{data.total_altas || 0}</td>
              <td style={{ color: 'var(--muted)' }}>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
