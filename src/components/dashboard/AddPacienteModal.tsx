// Modal "Adicionar paciente": cadastra uma internação manualmente na Visão Geral.
// Reusa o endpoint de criação manual (dedupe por hospital+atendimento no backend).
// A lista de hospitais vem da operadora atualmente selecionada no Dashboard.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'
import { criarPacienteManual } from '../../services/dashboard.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import type { Hospital, PacienteNovo } from '../../types/api'

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 as const }

export default function AddPacienteModal({ hospitais, hospitalInicial, onClose, onDone, onError }: {
  /** Hospitais da operadora atual (escopo do usuário) para o dropdown. */
  hospitais: Hospital[]
  /** Hospital pré-selecionado (o do filtro atual, se houver). */
  hospitalInicial?: string
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const qc = useQueryClient()
  const [hospital, setHospital] = useState(hospitalInicial ?? '')
  const [nome, setNome] = useState('')
  const [atendimento, setAtendimento] = useState('')
  const [dataEntrada, setDataEntrada] = useState('')
  const [tipoLeito, setTipoLeito] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [medico, setMedico] = useState('')
  const [saving, setSaving] = useState(false)

  const podeSalvar = hospital.trim() !== '' && nome.trim() !== ''
    && atendimento.trim() !== '' && dataEntrada.trim() !== ''

  async function salvar() {
    if (!hospital.trim()) { onError('Selecione o hospital do paciente.'); return }
    if (!nome.trim()) { onError('Informe o nome do paciente.'); return }
    if (!atendimento.trim()) { onError('Informe o atendimento do paciente.'); return }
    if (!dataEntrada.trim()) { onError('Informe a data de entrada do paciente.'); return }
    setSaving(true)
    try {
      const payload: PacienteNovo = {
        hospital_key: hospital.trim(),
        atendimento: atendimento.trim(),
        nome: nome.trim(),
        data_entrada: dataEntrada,
        tipo_leito: tipoLeito || null,
        especialidade: especialidade || null,
        medico: medico || null,
      }
      const res = await criarPacienteManual(payload)
      // Recompõe os agregados operacionais (Visão Geral, panorama, sidebar…).
      invalidarPorEvento(qc, 'pacienteAdicionado')
      onDone(res.ja_existia
        ? 'Este atendimento já existia — paciente não duplicado.'
        : '✓ Paciente adicionado')
    } catch (err) {
      onError(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Adicionar paciente"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving || !podeSalvar}>
            {saving ? 'Adicionando…' : 'Adicionar'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Hospital *</label>
          <select className="bm-input bm-select" value={hospital} onChange={(e) => setHospital(e.target.value)}>
            <option value="">Selecione…</option>
            {hospitais.map((h) => (
              <option key={h.key} value={h.key}>{h.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Nome do paciente *</label>
          <input type="text" className="bm-input" placeholder="Nome completo"
            value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Atendimento *</label>
            <input type="text" className="bm-input" placeholder="Nº de atendimento"
              value={atendimento} onChange={(e) => setAtendimento(e.target.value)} />
          </div>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Data de entrada *</label>
            <input type="date" className="bm-input"
              value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Leito</label>
            <input type="text" className="bm-input" placeholder="Opcional"
              value={tipoLeito} onChange={(e) => setTipoLeito(e.target.value)} />
          </div>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Especialidade</label>
            <input type="text" className="bm-input" placeholder="Opcional"
              value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="uppercase t-muted" style={labelStyle}>Médico</label>
          <input type="text" className="bm-input" placeholder="Opcional"
            value={medico} onChange={(e) => setMedico(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
