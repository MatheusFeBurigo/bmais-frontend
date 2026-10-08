// Modal da anotação que acompanha toda movimentação manual do card de censo
// (cobrar, atualizar e os dois desfazer) e a anotação avulsa do drawer. O texto
// vai para a timeline do card: é o "com quem falei e o que ficou combinado".
//
// Erro do backend aparece aqui dentro e a modal continua aberta: fechar
// perderia o que foi digitado, e o card não andou.
import { useState } from 'react'
import type { KanbanTarefa } from '../../types/api'
import { Modal, OpAvatar, Spinner } from '../ui'
import { nomeProprio } from '../../lib/texto'
import { ACOES_CENSO, type AcaoCenso } from './acoesCenso'

const MAX = 1000

export function AnotacaoCensoModal({ tarefa, acao, onConfirmar, onClose, sobreposta }: {
  tarefa: KanbanTarefa
  acao: AcaoCenso
  onConfirmar: (anotacao: string) => Promise<void>
  onClose: () => void
  /** Aberta por cima do drawer do censo. */
  sobreposta?: boolean
}) {
  const cfg = ACOES_CENSO[acao]
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const pronto = texto.trim().length > 0

  async function confirmar() {
    if (!pronto || salvando) return
    setSalvando(true)
    setErro(null)
    try {
      await onConfirmar(texto.trim())
      onClose()
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={cfg.titulo}
      onClose={salvando ? () => {} : onClose}
      sobreposta={sobreposta}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" disabled={salvando} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={salvando || !pronto}
                  onClick={confirmar}>
            {salvando && <Spinner size={12} />}
            {cfg.confirmar}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', fontSize: 'var(--t-sm)' }}>
          {tarefa.operadora_key && <OpAvatar opKey={tarefa.operadora_key} size={18} />}
          <span style={{ fontWeight: 600 }}>{nomeProprio(tarefa.hospital_nome || tarefa.titulo)}</span>
          {tarefa.operadora_nome && <span className="t-muted">{tarefa.operadora_nome}</span>}
        </div>
        <label className="form-lbl" htmlFor="censo-anotacao">
          Anotação<span className="req">*</span>
        </label>
        <textarea
          id="censo-anotacao" className="bm-input" rows={4} autoFocus maxLength={MAX}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          placeholder={cfg.placeholder} disabled={salvando}
          value={texto} onChange={(e) => setTexto(e.target.value)}
          // Ctrl+Enter confirma: quem anota no meio da ligação não quer ir ao mouse.
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) confirmar() }}
        />
        {erro && <div className="t-danger" role="alert" style={{ fontSize: 'var(--t-sm)' }}>{erro}</div>}
      </div>
    </Modal>
  )
}
