// Modal de exportação do Painel Operacional: o usuário escolhe entre exportar
// só a operadora atualmente selecionada ou todas as operadoras num único arquivo.
//
// Com filtros aplicados no painel (21/10/2026: "deve exportar com base nos
// filtros"), a primeira opção, já marcada, é a planilha só com os pacientes que
// a lista filtrada mostra. As planilhas inteiras continuam ao lado, para quem
// precisa do arquivo completo sem ter de limpar os filtros.
import { useState, type ReactNode } from 'react'
import { Modal } from '../ui'
import { exportarRvm, exportarRvmFiltrado, EXPORTAR_TODAS } from '../../services/dashboard.service'

type Escopo = 'filtrado' | 'operadora' | 'todas'

/** O que a lista do painel mostra com os filtros aplicados. */
export interface ExportacaoFiltrada {
  /** Internações da lista filtrada, de todas as páginas. */
  internacoes: number[]
  /** Os filtros aplicados, como o painel os diz ("UTI / CTI", "Hospital: ..."). */
  filtros: string[]
}

export default function ExportarModal({ operadora, operadoraNome, somenteTodas = false, filtrado, onClose, onError }: {
  /** Key da operadora atualmente selecionada no painel ('' na visão consolidada). */
  operadora: string
  /** Nome legível da operadora atual (para o rótulo da opção). */
  operadoraNome: string
  /** Visão consolidada aberta: não há "operadora atual" — só a opção "todas". */
  somenteTodas?: boolean
  /** Presente quando há filtro aplicado no painel. */
  filtrado?: ExportacaoFiltrada | null
  onClose: () => void
  onError: (msg: string) => void
}) {
  const qtdFiltrada = filtrado?.internacoes.length ?? 0
  const [escopo, setEscopo] = useState<Escopo>(
    filtrado && qtdFiltrada > 0 ? 'filtrado' : somenteTodas ? 'todas' : 'operadora')
  const [exportando, setExportando] = useState(false)
  const semFiltros = filtrado ? ', sem os filtros da tela' : ''

  async function exportar() {
    setExportando(true)
    try {
      if (escopo === 'filtrado' && filtrado) await exportarRvmFiltrado(operadora, filtrado.internacoes)
      else await exportarRvm(escopo === 'todas' ? EXPORTAR_TODAS : operadora)
      onClose()
    } catch {
      onError('Falha ao exportar')
    } finally {
      setExportando(false)
    }
  }

  return (
    <Modal
      title="Exportar controle de auditoria"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={exportando}>Cancelar</button>
          <button className="btn btn-primary" onClick={exportar}
                  disabled={exportando || (escopo === 'filtrado' && qtdFiltrada === 0)}>
            {exportando ? 'Exportando…' : 'Exportar'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginBottom: 2 }}>
          {filtrado
            ? 'O painel está com filtros aplicados. Escolha o que incluir na planilha:'
            : somenteTodas
              ? 'A visão consolidada exporta todas as operadoras num único arquivo:'
              : 'Escolha o que incluir na planilha:'}
        </div>
        {filtrado && (
          <OpcaoEscopo
            selecionado={escopo === 'filtrado'}
            onSelect={() => setEscopo('filtrado')}
            desabilitado={qtdFiltrada === 0}
            titulo={`Com os filtros do painel (${qtdFiltrada} ${qtdFiltrada === 1 ? 'paciente' : 'pacientes'})`}
            descricao={qtdFiltrada === 0
              ? 'Nenhum paciente na lista com esses filtros.'
              : 'Só os pacientes que a lista mostra agora, de todas as páginas.'}
          >
            {filtrado.filtros.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {filtrado.filtros.map((f) => (
                  <span key={f} className="filtro-tag" style={{ background: 'var(--surface)' }}>{f}</span>
                ))}
              </div>
            )}
          </OpcaoEscopo>
        )}
        {!somenteTodas && (
          <OpcaoEscopo
            selecionado={escopo === 'operadora'}
            onSelect={() => setEscopo('operadora')}
            titulo={`Somente ${operadoraNome || 'a operadora atual'}`}
            descricao={`Um arquivo com os internados da operadora selecionada${semFiltros}.`}
          />
        )}
        <OpcaoEscopo
          selecionado={escopo === 'todas'}
          onSelect={() => setEscopo('todas')}
          titulo="Todas as operadoras"
          descricao={`Um único arquivo com uma aba por hospital de cada operadora${semFiltros}.`}
        />
      </div>
    </Modal>
  )
}

// Cartão de opção clicável com radio — o cartão inteiro é a área de clique.
function OpcaoEscopo({ selecionado, onSelect, titulo, descricao, desabilitado = false, children }: {
  selecionado: boolean
  onSelect: () => void
  titulo: string
  descricao: string
  desabilitado?: boolean
  children?: ReactNode
}) {
  return (
    <label
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: desabilitado ? 'not-allowed' : 'pointer',
        border: `1px solid ${selecionado ? 'var(--primary)' : 'var(--border-strong)'}`,
        borderRadius: 10, padding: '12px 14px',
        background: selecionado ? 'var(--primary-soft)' : 'var(--surface)',
        opacity: desabilitado ? 0.6 : undefined,
      }}
    >
      <input
        type="radio"
        name="export-escopo"
        checked={selecionado}
        onChange={onSelect}
        disabled={desabilitado}
        style={{ marginTop: 3 }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--t-base)', color: 'var(--ink)' }}>{titulo}</div>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 2 }}>{descricao}</div>
        {children}
      </div>
    </label>
  )
}
