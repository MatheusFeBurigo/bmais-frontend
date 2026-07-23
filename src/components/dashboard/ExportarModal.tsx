// Modal de exportação do Painel Operacional: o usuário escolhe entre exportar
// só a operadora atualmente selecionada ou todas as operadoras num único arquivo.
import { useState } from 'react'
import { Modal } from '../ui'
import { exportarRvm, EXPORTAR_TODAS } from '../../services/dashboard.service'

type Escopo = 'operadora' | 'todas'

export default function ExportarModal({ operadora, operadoraNome, onClose, onError }: {
  /** Key da operadora atualmente selecionada no painel. */
  operadora: string
  /** Nome legível da operadora atual (para o rótulo da opção). */
  operadoraNome: string
  onClose: () => void
  onError: (msg: string) => void
}) {
  const [escopo, setEscopo] = useState<Escopo>('operadora')
  const [exportando, setExportando] = useState(false)

  async function exportar() {
    setExportando(true)
    try {
      await exportarRvm(escopo === 'todas' ? EXPORTAR_TODAS : operadora)
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
          <button className="btn btn-primary" onClick={exportar} disabled={exportando}>
            {exportando ? 'Exportando…' : 'Exportar'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginBottom: 2 }}>
          Escolha o que incluir na planilha:
        </div>
        <OpcaoEscopo
          selecionado={escopo === 'operadora'}
          onSelect={() => setEscopo('operadora')}
          titulo={`Somente ${operadoraNome || 'a operadora atual'}`}
          descricao="Um arquivo com os internados da operadora selecionada."
        />
        <OpcaoEscopo
          selecionado={escopo === 'todas'}
          onSelect={() => setEscopo('todas')}
          titulo="Todas as operadoras"
          descricao="Um único arquivo com uma aba por hospital de cada operadora."
        />
      </div>
    </Modal>
  )
}

// Cartão de opção clicável com radio — o cartão inteiro é a área de clique.
function OpcaoEscopo({ selecionado, onSelect, titulo, descricao }: {
  selecionado: boolean
  onSelect: () => void
  titulo: string
  descricao: string
}) {
  return (
    <label
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
        border: `1px solid ${selecionado ? 'var(--primary)' : 'var(--border-strong)'}`,
        borderRadius: 10, padding: '12px 14px',
        background: selecionado ? 'var(--primary-soft)' : 'var(--surface)',
      }}
    >
      <input
        type="radio"
        name="export-escopo"
        checked={selecionado}
        onChange={onSelect}
        style={{ marginTop: 3 }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--t-base)', color: 'var(--ink)' }}>{titulo}</div>
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 2 }}>{descricao}</div>
      </div>
    </label>
  )
}
