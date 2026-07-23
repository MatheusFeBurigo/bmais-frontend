// Tabela de pacientes do Gestor (apresentação pura). Extraída de pages/Gestor.tsx.
// Serve tanto a lista principal do dia quanto a lista filtrada por faixa.
import type { GestorMetrics } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { COR } from './gestor.styles'

export default function TabelaPacientes({ pacientes, onSelecionar, onPrefetch, vazio, maxHeight = 480 }: {
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
