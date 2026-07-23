// Painel de detalhe/edição de um profissional (dados + escala + ativar/desativar).
// Extraído de pages/Equipe.tsx.
import { useState } from 'react'
import type { ProfTipo, ProfissionalDetalhe } from '../../types/api'
import { Badge } from '../ui'
import { atualizarProfissional, definirAtivoProfissional } from '../../services/equipe.service'
import { TIPO_LABEL, isAtivo } from './equipe.styles'
import { IconPlus, IconCheck } from './icons'
import EscalaList from './EscalaList'
import FormEscala from './FormEscala'

export default function DetalheProf({ detalhe, opsLista, onToast, onChanged }: {
  detalhe: ProfissionalDetalhe
  opsLista: Array<{ key: string; nome: string }>
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const p = detalhe.profissional
  const ativo = isAtivo(p)
  const [nome, setNome] = useState(p.nome)
  const [tipo, setTipo] = useState<ProfTipo>(p.tipo)
  const [formEscala, setFormEscala] = useState(false)
  const [saving, setSaving] = useState(false)

  async function salvarEdicao() {
    const n = nome.trim()
    if (!n) { onToast('Nome não pode ser vazio'); return }
    setSaving(true)
    try {
      await atualizarProfissional(p.id, n, tipo)
      onToast('✓ Dados atualizados')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo() {
    const novo = !ativo
    if (!confirm(`${novo ? 'Reativar' : 'Desativar'} este profissional?`)) return
    try {
      await definirAtivoProfissional(p.id, novo)
      onToast(novo ? '✓ Profissional reativado' : 'Profissional desativado')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="row" style={{ gap: 14, marginBottom: 16 }}>
        <div className={`prof-avatar ${tipo}`} style={{ width: 44, height: 44, fontSize: 15, borderRadius: 12 }}>{nome.slice(0, 2).toUpperCase()}</div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="fw-7" style={{ fontSize: 'var(--t-lg)', color: 'var(--ink)', lineHeight: 1.2 }}>{p.nome}</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginTop: 2 }}>{TIPO_LABEL[p.tipo]}</div>
        </div>
        {ativo ? <Badge variant="success" dot>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
      </div>

      {/* Campos editáveis */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16, padding: 14, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div className="edit-field">
          <label>Nome completo</label>
          <input type="text" className="bm-input" style={{ fontSize: 'var(--t-sm)' }} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="edit-field">
          <label>Cargo / Tipo</label>
          <select className="bm-input bm-select" style={{ fontSize: 'var(--t-sm)' }} value={tipo} onChange={(e) => setTipo(e.target.value as ProfTipo)}>
            <option value="E">Enfermeiro(a)</option>
            <option value="M">Médico(a) Auditor(a)</option>
            <option value="O">Operador(a) Interno(a)</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={salvarEdicao} disabled={saving}>
            {IconCheck}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Escala de Hospitais */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Escala de Hospitais</div>
        <button className="btn btn-outline btn-sm" onClick={() => setFormEscala((v) => !v)}>
          {IconPlus}
          Adicionar
        </button>
      </div>

      {formEscala && (
        <FormEscala
          profId={p.id}
          opsLista={opsLista}
          onClose={() => setFormEscala(false)}
          onToast={onToast}
          onChanged={onChanged}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <EscalaList escala={detalhe.escala} onToast={onToast} onChanged={onChanged} />
      </div>

      {/* Ações */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${ativo ? 'btn-outline' : 'btn-primary'}`} onClick={toggleAtivo}>
          {ativo ? 'Desativar' : '✓ Reativar'}
        </button>
      </div>
    </div>
  )
}
