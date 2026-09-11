// Modal "Adicionar paciente": cadastra uma internação manualmente na Visão Geral.
// Reusa o endpoint de criação manual (dedupe por hospital+atendimento no backend).
// Fluxo de dois níveis: escolhe-se a operadora e então o hospital dela (via um
// combobox pesquisável de valor fechado — digita para filtrar, seleciona um item real).
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'
import { HospitalCombobox } from '../HospitalCombobox'
import { criarPacienteManual } from '../../services/dashboard.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import type { Hospital, PacienteNovo } from '../../types/api'

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 as const }

// Domínio fechado do tipo de leito (mesmo vocabulário de Paciente.tsx / LeitoTag).
const LEITO_OPCOES = [
  { value: 'UTI', label: 'UTI' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'ENFERMARIA', label: 'Enfermaria' },
] as const

export default function AddPacienteModal({
  operadoras, hospitaisPorOperadora, operadoraInicial, hospitalInicial,
  onClose, onDone, onError,
}: {
  /** Operadoras do escopo do usuário, para o 1º nível de seleção. */
  operadoras: Array<{ key: string; nome: string }>
  /** Hospitais indexados por operadora (do panorama, já recortado ao escopo). */
  hospitaisPorOperadora: Record<string, Hospital[]>
  /** Operadora pré-selecionada (a aberta no Dashboard, se houver). */
  operadoraInicial?: string
  /** Hospital pré-selecionado (o do filtro atual, se houver). */
  hospitalInicial?: string
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}) {
  const qc = useQueryClient()
  const [operadora, setOperadora] = useState(operadoraInicial ?? '')
  const [hospital, setHospital] = useState(hospitalInicial ?? '')
  const [nome, setNome] = useState('')
  const [atendimento, setAtendimento] = useState('')
  const [dataEntrada, setDataEntrada] = useState('')
  const [tipoLeito, setTipoLeito] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [medico, setMedico] = useState('')
  const [saving, setSaving] = useState(false)

  // Hospitais da operadora escolhida (1º nível). Ordenados por nome para a busca.
  const hospitaisDaOperadora = useMemo(() => {
    const lista = hospitaisPorOperadora[operadora] ?? []
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [hospitaisPorOperadora, operadora])

  // Trocar de operadora invalida o hospital antes escolhido (era de outra operadora).
  function trocarOperadora(nova: string) {
    setOperadora(nova)
    setHospital('')
  }

  const podeSalvar = hospital.trim() !== '' && nome.trim() !== ''
    && atendimento.trim() !== '' && dataEntrada.trim() !== ''

  async function salvar() {
    if (!operadora.trim()) { onError('Selecione a operadora do paciente.'); return }
    if (!hospital.trim()) { onError('Selecione o hospital do paciente na lista.'); return }
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Operadora *</label>
            <select className="bm-input bm-select" value={operadora}
              onChange={(e) => trocarOperadora(e.target.value)}>
              <option value="">Selecione…</option>
              {operadoras.map((o) => (
                <option key={o.key} value={o.key}>{o.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="uppercase t-muted" style={labelStyle}>Hospital *</label>
            <HospitalCombobox
              hospitais={hospitaisDaOperadora}
              value={hospital}
              disabled={!operadora}
              placeholder={operadora ? 'Digite o nome do hospital…' : 'Escolha a operadora primeiro'}
              onChange={setHospital}
            />
          </div>
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
            <select className="bm-input bm-select" value={tipoLeito} onChange={(e) => setTipoLeito(e.target.value)}>
              <option value="">Selecione…</option>
              {LEITO_OPCOES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
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
