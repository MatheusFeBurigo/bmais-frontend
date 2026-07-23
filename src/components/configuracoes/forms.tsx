// Formulários da tela Configurações (apresentação + submit via services).
// Extraídos de pages/Configuracoes.tsx.
import { useState } from 'react'
import type { HospitalSelected, Profissional } from '../../types/api'
import { Modal } from '../ui'
import { criarOperadora, criarHospital } from '../../services/configuracoes.service'
import { adicionarEscala } from '../../services/escala.service'
import { SERVICO_LABEL, SERVICOS } from './configuracoes.styles'

export function AddHospitalForm({ opKey, onClose, onToast, onChanged }: { opKey: string; onClose: () => void; onToast: (m: string) => void; onChanged: () => void }) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  async function criar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome do hospital'); return }
    setSaving(true)
    try {
      const key = n.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
      const d = await criarHospital(n, opKey, key)
      if (d.ok || d.criado) { onToast('✓ Hospital adicionado'); onChanged(); onClose() }
      else onToast('Erro ao adicionar hospital')
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12 }}>
      <div className="uppercase t-muted" style={{ marginBottom: 8, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Novo hospital</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <input type="text" className="bm-input" placeholder="Nome do hospital" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={criar} disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  )
}

export function AddEscalaHospForm({ hosp, opKey, profs, onClose, onToast, onChanged }: {
  hosp: HospitalSelected
  opKey: string
  profs: Profissional[]
  onClose: () => void
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const [prof, setProf] = useState('')
  const [servico, setServico] = useState('P')
  const [saving, setSaving] = useState(false)

  async function adicionar() {
    if (!prof) { onToast('Selecione o profissional'); return }
    setSaving(true)
    try {
      await adicionarEscala({
        hospital_key: hosp.key, hospital_nome: hosp.nome, operadora_key: opKey,
        servico, profissional_id: parseInt(prof),
      })
      onToast('✓ Profissional adicionado à escala')
      onChanged()
      onClose()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  const labelStyle = { display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={labelStyle}>Profissional</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={prof} onChange={(e) => setProf(e.target.value)}>
            <option value="">Selecione…</option>
            {profs.map((p) => <option key={p.id} value={p.id}>[{p.tipo}] {p.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Serviço</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s} value={s}>{s} — {SERVICO_LABEL[s]}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={adicionar} disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  )
}

export function NovaOperadoraModal({ onClose, onDone, onError }: { onClose: () => void; onDone: (key: string) => void; onError: (m: string) => void }) {
  const [nome, setNome] = useState('')
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)

  async function criar() {
    if (!nome.trim() || !key.trim()) { onError('Preencha nome e chave'); return }
    setSaving(true)
    try {
      const d = await criarOperadora(nome, key)
      if (d.ok || d.criado) onDone(key.trim())
      else onError('Erro: chave já existe?')
    } catch (e) { onError(`Erro: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  return (
    <Modal title="Nova Operadora" onClose={onClose} footer={
      <>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={criar} disabled={saving}>{saving ? 'Criando…' : 'Criar operadora'}</button>
      </>
    }>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div className="uppercase t-muted" style={{ marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Nome da operadora *</div>
          <input type="text" className="bm-input" placeholder="Ex: Amil Saúde" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div>
          <div className="uppercase t-muted" style={{ marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 }}>Chave / ID (sem espaços) *</div>
          <input type="text" className="bm-input" placeholder="Ex: amil" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
        </div>
      </div>
    </Modal>
  )
}
