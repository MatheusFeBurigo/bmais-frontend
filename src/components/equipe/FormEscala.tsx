// Formulário: adicionar hospital à escala de um profissional (selects
// encadeados operadora → hospital → serviço). Extraído de pages/Equipe.tsx.
import { useState } from 'react'
import { useHospitais } from '../../hooks/useEquipe'
import { adicionarEscala } from '../../services/escala.service'
import { SERVICOS } from './equipe.styles'

export default function FormEscala({ profId, opsLista, onClose, onToast, onChanged }: {
  profId: number
  opsLista: Array<{ key: string; nome: string }>
  onClose: () => void
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const [op, setOp] = useState('')
  const [hosp, setHosp] = useState('') // "key|nome"
  const [servico, setServico] = useState('P')
  const [saving, setSaving] = useState(false)

  const { data: hospitais, isFetching } = useHospitais(op)

  async function adicionar() {
    if (!op) { onToast('Selecione a operadora'); return }
    if (!hosp) { onToast('Selecione o hospital'); return }
    const [hospKey, hospNome] = hosp.split('|')
    setSaving(true)
    try {
      await adicionarEscala({
        hospital_key: hospKey, hospital_nome: hospNome, operadora_key: op,
        servico, profissional_id: profId,
      })
      onToast('✓ Hospital adicionado à escala')
      onChanged()
      onClose()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.1em', fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }

  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={labelStyle}>Operadora</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={op} onChange={(e) => { setOp(e.target.value); setHosp('') }}>
            <option value="">Selecione…</option>
            {opsLista.map((o) => <option key={o.key} value={o.key}>{o.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Hospital</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={hosp} onChange={(e) => setHosp(e.target.value)} disabled={!op}>
            <option value="">{!op ? 'Selecione a operadora primeiro' : isFetching ? 'Carregando…' : 'Selecione…'}</option>
            {(hospitais ?? []).map((h) => <option key={h.key} value={`${h.key}|${h.nome}`}>{h.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Serviço</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={adicionar} disabled={saving}>Adicionar</button>
        </div>
      </div>
    </div>
  )
}
