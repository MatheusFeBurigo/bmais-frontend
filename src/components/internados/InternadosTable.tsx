// Tabela de internados do Dashboard (card completo: header + tabela + paginação).
// Extraída de Dashboard.tsx, que só orquestra estado/filtros e passa os dados
// já filtrados/paginados para cá. Componente de apresentação puro.

import type { Internacao } from '../../types/api'
import { StatusBadge, rowFlagClass, LeitoTag } from '../StatusBadge'
import { OpAvatar } from '../ui'
import { DiasRatio, Permanencia } from './cells'
import { identificacaoPaciente } from '../../lib/texto'

export interface InternadosTableProps {
  /** Linhas da página atual (já filtradas e fatiadas). */
  paginados: Internacao[]
  /** Total de linhas visíveis após filtro (para o rodapé "X de Y"). */
  totalVisiveis: number
  /** Total de internações sem filtro (para o comparativo "filtrados de N"). */
  totalInternacoes: number
  /** Total de internados reportado pelo backend (fallback do rodapé). */
  totalBackend: number
  paginaAtual: number
  totalPaginas: number
  porPagina: number
  onExportar: () => void
  /** Abre o modal de adicionar paciente (ação ao lado do Exportar). */
  /** Ausente = perfil somente leitura: o botão "Adicionar paciente" não aparece. */
  onAdicionarPaciente?: () => void
  onSelecionar: (id: number) => void
  /** Clique no nome do hospital: abre a ficha dele, sem abrir o paciente. */
  onSelecionarHospital?: (hospital: { key: string; nome: string }) => void
  /** Prefetch em background ao passar o mouse na linha (abre o drawer instantâneo). */
  onPrefetch?: (id: number) => void
  onPrev: () => void
  onNext: () => void
  /** Visão consolidada (todas as operadoras): mostra a coluna "Operadora" para
   *  dizer de quem é cada paciente. Numa operadora só, a coluna é redundante. */
  mostrarOperadora?: boolean
}

export default function InternadosTable({
  paginados,
  totalVisiveis,
  totalInternacoes,
  totalBackend,
  paginaAtual,
  totalPaginas,
  porPagina,
  onExportar,
  onAdicionarPaciente,
  onSelecionar,
  onSelecionarHospital,
  onPrefetch,
  onPrev,
  onNext,
  mostrarOperadora = false,
}: InternadosTableProps) {
  const colunas = mostrarOperadora ? 12 : 11
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-header" style={{ alignItems: 'center', paddingBottom: 14 }}>
        <div>
          <div className="card-title">Todos os Internados</div>
          <div className="card-sub">
            <span className="mono fw-6">{totalVisiveis}</span> de{' '}
            <span className="mono fw-6">{totalBackend || totalInternacoes}</span>
            <span className="dot-sep" />
            Clique na linha para detalhes
          </div>
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={onExportar}>Exportar</button>
          {onAdicionarPaciente && (
            <button className="btn btn-primary btn-sm" onClick={onAdicionarPaciente}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Adicionar paciente
            </button>
          )}
        </div>
      </div>

      <div style={{ maxHeight: 560, overflowY: 'auto' }}>
        <table className="bmais-table">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Relatório</th>
              {mostrarOperadora && <th style={{ width: 130 }}>Operadora</th>}
              <th>Hospital</th>
              <th>Segurado</th>
              <th style={{ width: 86 }}>Atend.</th>
              <th style={{ width: 60 }}>Leito</th>
              <th style={{ width: 96 }}>Internação</th>
              <th>Última Visita</th>
              <th style={{ width: 96 }} className="t-right" title="Dias desde o último relatório sobre a janela permitida (ex.: 5 / 7)">
                Sem relatório
              </th>
              <th style={{ width: 88 }} className="t-right" title="Dias de internação sobre o gatilho de alerta (ex.: 12 / 10)">
                Dias internado
              </th>
              <th style={{ width: 78 }} className="t-right" title="Marcador de longa permanência: 10 dias ou 30 dias">
                Permanência
              </th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {paginados.map((p) => {
              const sr = p.status_relatorio || 'EM_DIA'
              return (
                <tr key={p.id} className={rowFlagClass(sr)} style={{ cursor: 'pointer' }} onClick={() => onSelecionar(p.id)}
                  onMouseEnter={onPrefetch ? () => onPrefetch(p.id) : undefined}
                  onFocus={onPrefetch ? () => onPrefetch(p.id) : undefined}>
                  <td><StatusBadge sr={sr} /></td>
                  {mostrarOperadora && (
                    <td>
                      <span className="row" style={{ gap: 6, alignItems: 'center' }} title={p.operadora_nome || p.operadora_key || undefined}>
                        <OpAvatar opKey={p.operadora_key || ''} size={18} />
                        <span className="truncate" style={{ fontSize: 'var(--t-sm)', maxWidth: 100 }}>
                          {p.operadora_nome || p.operadora_key || '—'}
                        </span>
                      </span>
                    </td>
                  )}
                  <td>
                    {/* A linha inteira abre o paciente; o nome do hospital é a
                        exceção — abre a ficha dele, e por isso para o clique
                        antes de subir para a <tr>. */}
                    {onSelecionarHospital && p.hospital_key && p.hospital_nome ? (
                      <button
                        type="button"
                        className="link-cell"
                        style={{ fontSize: 'var(--t-sm)' }}
                        title={`Ver detalhes de ${p.hospital_nome}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelecionarHospital({ key: p.hospital_key as string, nome: p.hospital_nome as string })
                        }}
                      >
                        {p.hospital_nome}
                      </button>
                    ) : (
                      <span style={{ fontSize: 'var(--t-sm)' }}>{p.hospital_nome || '—'}</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 240 }}><div className="truncate fw-5">{identificacaoPaciente(p)}</div></td>
                  <td><span className="mono t-muted" style={{ fontSize: 'var(--t-sm)' }}>{p.atendimento || '—'}</span></td>
                  <td><LeitoTag tipo={p.tipo_leito} /></td>
                  <td><span className="mono" style={{ fontSize: 'var(--t-sm)' }}>{p.data_entrada || '—'}</span></td>
                  <td><span className="mono" style={{ fontSize: 'var(--t-sm)' }}>{p.data_ultima_visita || '—'}</span></td>
                  <td className="t-right">
                    <DiasRatio
                      value={p.dias_sem_relatorio}
                      limit={p.janela_relatorio}
                      tone={
                        sr === 'SEM_RELATORIO' || sr === 'ALTA_SEM_REL'
                          ? 'danger'
                          : sr === 'VENCIDO' || sr === 'ALTA_REL_VENCIDO'
                            ? 'warning'
                            : 'neutral'
                      }
                    />
                  </td>
                  <td className="t-right">
                    <DiasRatio
                      value={p.dias}
                      limit={p.gatilho}
                      tone={p.longa_30 ? 'danger' : p.longa_10 ? 'warning' : 'neutral'}
                    />
                  </td>
                  <td className="t-right">
                    <Permanencia
                      longa10={p.longa_10}
                      longa30={p.longa_30}
                      limiteLonga={p.limite_longa}
                      limiteAvancada={p.limite_avancada}
                    />
                  </td>
                  <td onClick={(e) => { e.stopPropagation(); onSelecionar(p.id) }}>
                    <button className="btn btn-ghost btn-sm" title="Registrar relatório" style={{ padding: 5, color: 'var(--accent)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </td>
                </tr>
              )
            })}
            {totalVisiveis === 0 && (
              <tr>
                <td colSpan={colunas}>
                  <div className="empty-state">
                    <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>📋</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum internado encontrado</div>
                    <div style={{ fontSize: 'var(--t-sm)' }}>Tente outro filtro ou operadora.</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          {totalVisiveis > 0 ? (
            <>
              Mostrando {(paginaAtual - 1) * porPagina + 1}–{Math.min(paginaAtual * porPagina, totalVisiveis)} de {totalVisiveis}
              {totalVisiveis !== totalInternacoes && ` (filtrados de ${totalInternacoes})`}
            </>
          ) : (
            <>Mostrando 0 de {totalBackend || totalInternacoes}</>
          )}
        </span>
        {totalPaginas > 1 && (
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={paginaAtual <= 1} onClick={onPrev}>
              Anterior
            </button>
            <span style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
              {paginaAtual} / {totalPaginas}
            </span>
            <button className="btn btn-outline btn-sm" disabled={paginaAtual >= totalPaginas} onClick={onNext}>
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
