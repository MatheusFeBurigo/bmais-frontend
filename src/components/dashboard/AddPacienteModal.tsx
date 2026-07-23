// Modal "Adicionar paciente": cadastra uma internação manualmente na Visão Geral.
// Reusa o endpoint de criação manual (dedupe por hospital+atendimento no backend).
// Fluxo de dois níveis: escolhe-se a operadora e então o hospital dela (via um
// combobox pesquisável de valor fechado — digita para filtrar, seleciona um item real).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'
import { criarPacienteManual } from '../../services/dashboard.service'
import { invalidarPorEvento } from '../../lib/invalidation'
import type { Hospital, PacienteNovo } from '../../types/api'

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 10, letterSpacing: '.1em', fontWeight: 600 as const }

// Normaliza para comparação: minúsculas e sem acentos, para "sao" casar com "São".
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Estilos do combobox de hospital (mesmo visual do MedicoCombobox).
const comboStyles = `
.mc-wrap{position:relative}
.mc-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md,8px);box-shadow:0 8px 24px rgba(6,46,92,.12);max-height:200px;overflow-y:auto;padding:4px}
.mc-opt{padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.mc-opt:hover,.mc-opt.active{background:var(--primary-soft);color:var(--primary)}
.mc-empty{padding:8px 10px;font-size:var(--t-sm);color:var(--muted)}
`

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

  // Combobox de hospital: texto digitado (buscaHospital) + valor fechado (hospital).
  const [buscaHospital, setBuscaHospital] = useState(() =>
    (hospitaisPorOperadora[operadoraInicial ?? ''] ?? []).find((h) => h.key === hospitalInicial)?.nome ?? '',
  )
  const [comboAberto, setComboAberto] = useState(false)
  const [comboAtivo, setComboAtivo] = useState(0)
  const comboRef = useRef<HTMLDivElement>(null)

  // Hospitais da operadora escolhida (1º nível). Ordenados por nome para a busca.
  const hospitaisDaOperadora = useMemo(() => {
    const lista = hospitaisPorOperadora[operadora] ?? []
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [hospitaisPorOperadora, operadora])

  const hospitaisFiltrados = useMemo(() => {
    const q = normalizar(buscaHospital)
    // Só filtra quando o texto ainda não corresponde exatamente ao hospital escolhido
    // (senão a lista sumiria para "1 resultado" logo após selecionar).
    const jaSelecionado = hospitaisDaOperadora.some((h) => h.key === hospital && h.nome === buscaHospital)
    const base = q && !jaSelecionado
      ? hospitaisDaOperadora.filter((h) => normalizar(h.nome).includes(q))
      : hospitaisDaOperadora
    return base.slice(0, 50)
  }, [buscaHospital, hospitaisDaOperadora, hospital])

  // Trocar de operadora invalida o hospital antes escolhido (era de outra operadora).
  function trocarOperadora(nova: string) {
    setOperadora(nova)
    setHospital('')
    setBuscaHospital('')
    setComboAberto(false)
  }

  function selecionarHospital(h: Hospital) {
    setHospital(h.key)
    setBuscaHospital(h.nome)
    setComboAberto(false)
  }

  function onBuscaChange(texto: string) {
    setBuscaHospital(texto)
    setHospital('')       // digitar reabre a escolha: valor fechado só volta ao selecionar
    setComboAberto(true)
    setComboAtivo(0)
  }

  function onComboKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setComboAberto(true); setComboAtivo((i) => Math.min(i + 1, hospitaisFiltrados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setComboAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && comboAberto && hospitaisFiltrados[comboAtivo]) {
      e.preventDefault(); selecionarHospital(hospitaisFiltrados[comboAtivo])
    } else if (e.key === 'Escape') {
      setComboAberto(false)
    }
  }

  // Fecha o menu ao clicar fora.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) setComboAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

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
      <style>{comboStyles}</style>
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
            <div className="mc-wrap" ref={comboRef}>
              <input
                type="text"
                className="bm-input"
                placeholder={operadora ? 'Digite ou selecione…' : 'Escolha a operadora primeiro'}
                autoComplete="off"
                disabled={!operadora}
                value={buscaHospital}
                onChange={(e) => onBuscaChange(e.target.value)}
                onFocus={() => operadora && setComboAberto(true)}
                onKeyDown={onComboKey}
              />
              {comboAberto && operadora && (
                <div className="mc-menu">
                  {hospitaisFiltrados.length === 0 && (
                    <div className="mc-empty">
                      {hospitaisDaOperadora.length === 0
                        ? 'Nenhum hospital nesta operadora'
                        : 'Nenhum hospital encontrado'}
                    </div>
                  )}
                  {hospitaisFiltrados.map((h, i) => (
                    <div
                      key={h.key}
                      className={`mc-opt${i === comboAtivo ? ' active' : ''}`}
                      onMouseEnter={() => setComboAtivo(i)}
                      onMouseDown={(e) => { e.preventDefault(); selecionarHospital(h) }}
                    >
                      {h.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
