// Tabela de pacientes do Gestor (apresentação pura). Extraída de pages/Gestor.tsx.
// Serve tanto a lista principal do dia quanto a lista filtrada por faixa.
import type { GestorMetrics } from '../../types/api'
import { Badge, OpAvatar } from '../ui'
import { COR } from './gestor.styles'
import { identificacaoPaciente } from '../../lib/texto'
import { rotuloMotivoAlta } from '../../lib/motivoAlta'
import { dataBR } from '../../lib/datas'
import { resumoHomecare } from '../../lib/altaHomecare'
import { ACEITES_FOLHA_ROSA } from '../paciente/SecaoFolhaRosa'

type Paciente = GestorMetrics['pacientes_dia'][number]

/** Prorrogação, negociação e home care do paciente, uma linha cada, abaixo da
 *  situação (12/11/2026; home care em 13/11): é o que os filtros de situação
 *  recortam. */
function SituacaoExtra({ p }: { p: Paciente }) {
  const pr = p.prorrogacao
  const neg = p.negociacao
  return (
    <>
      {pr && (
        <div className="sit-linha">
          {pr.pausada ? 'Prorrogação pausada' : `Prorrogado até ${dataBR(pr.ate).slice(0, 5)}`}
        </div>
      )}
      {neg && (
        <div className="sit-linha" title={[
          `Negociação: ${neg.de ?? '?'} para ${neg.para ?? '?'}`,
          neg.diarias ? `${neg.diarias} ${neg.diarias === 1 ? 'diária' : 'diárias'}` : '',
          neg.data_inicio ? `${dataBR(neg.data_inicio)}${neg.data_fim ? ` a ${dataBR(neg.data_fim)}` : ''}` : '',
        ].filter(Boolean).join(' · ')}>
          Negociação: {neg.de} → {neg.para}
          {neg.diarias ? ` · ${neg.diarias}d` : ''}
        </div>
      )}
      {p.homecare && (
        <div className="sit-linha" title={resumoHomecare(p.homecare)}>
          Home care{p.homecare.data_visita ? ` desde a visita de ${dataBR(p.homecare.data_visita).slice(0, 5)}` : ''}
        </div>
      )}
      {neg?.aceite && (
        <div className={`sit-linha${neg.aceite === 'aguardando' ? ' alerta' : ''}`}>
          {neg.aceite === 'aguardando' ? 'Aguardando aceite' : `Aceite: ${ACEITES_FOLHA_ROSA[neg.aceite] ?? neg.aceite}`}
        </div>
      )}
    </>
  )
}

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
                <div className="fw-6 truncate" style={{ maxWidth: 220 }}>{identificacaoPaciente(p)}</div>
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }} className="mono">{p.atendimento}</div>
              </td>
              <td className="truncate" style={{ maxWidth: 200, fontSize: 'var(--t-base)' }}>{p.hospital_nome}</td>
              <td><OpAvatar opKey={p.operadora_key} size={24} /></td>
              <td className="mono" style={{ fontSize: 'var(--t-base)' }}>{p.data_entrada}</td>
              <td className="t-right mono fw-6" style={{ color: p.faixa === '30p' ? COR.vermelho : p.faixa === '10_29' ? COR.laranja : undefined }}>{p.dias}</td>
              <td>
                {p.situacao === 'ALTA' ? (
                  <>
                    <Badge variant="success" dot>Alta</Badge>
                    {/* O motivo da alta (homecare, óbito...). A do censo ainda chega sem. */}
                    <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 3 }}>
                      {rotuloMotivoAlta(p.motivo_alta) ?? 'Não informado'}
                    </div>
                  </>
                ) : <Badge variant="info" dot>Internado</Badge>}
                <SituacaoExtra p={p} />
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
