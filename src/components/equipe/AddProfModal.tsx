// Modal: adicionar novo profissional. Extraído de pages/Equipe.tsx.
import { useState } from 'react'
import type { ProfTipo } from '../../types/api'
import { Modal } from '../ui'
import { criarProfissional } from '../../services/equipe.service'

export default function AddProfModal({ onClose, onDone, onError }: {
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [tipo, setTipo] = useState<ProfTipo>('E')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  async function adicionar() {
    const n = nome.trim()
    if (!n) { onError('Informe o nome do profissional'); return }
    setSaving(true)
    try {
      await criarProfissional(n, tipo)
      onDone('✓ Profissional adicionado')
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Adicionar Profissional"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={adicionar} disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="uppercase t-muted" style={{ display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Tipo *</label>
          <select className="bm-input bm-select" value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
          </select>
        </div>
        <div>
          <label className="uppercase t-muted" style={{ display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Nome completo *</label>
          <input type="text" className="bm-input" placeholder="Ex: Ana Clara Souza" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
      </div>
    </Modal>
  )
}
