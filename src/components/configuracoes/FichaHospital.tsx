// Ficha cadastral do hospital: dados/contatos + operadoras vinculadas (N-N).
// Apresentação pura — o submit vai pelos services, o refetch é do orquestrador.
import { useState } from 'react'
import type { HospitalSelected, OperadoraCard, OperadoraVinculo } from '../../types/api'
import {
  salvarFichaHospital, vincularOperadora, desvincularOperadora,
} from '../../services/configuracoes.service'
import { OpAvatar } from '../ui'
import SelectRegiao from '../SelectRegiao'

/** Chaves da ficha que este formulário edita — restritas às que existem em
 *  HospitalSelected, para o typecheck pegar um campo renomeado no backend. */
type CampoFicha = keyof Pick<HospitalSelected,
  'telefone' | 'email' | 'cnpj' | 'regiao' | 'endereco' | 'cidade' | 'uf' | 'cep'>

/** Campos editáveis da ficha, na ordem em que aparecem no formulário.
 *  `regiao` é o único com lista fechada: ela agrupa os hospitais na escolha de
 *  escopo do usuário, e digitada à mão a mesma região virava várias (era texto
 *  livre até aqui, e 95 das 402 linhas ficaram em branco). */
const CAMPOS: Array<{ k: CampoFicha; label: string; placeholder?: string; tipo?: string; opcoes?: boolean }> = [
  { k: 'telefone', label: 'Telefone', placeholder: '(11) 0000-0000', tipo: 'tel' },
  { k: 'email', label: 'E-mail', placeholder: 'contato@hospital.com.br', tipo: 'email' },
  { k: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { k: 'regiao', label: 'Região', opcoes: true },
  { k: 'endereco', label: 'Endereço', placeholder: 'Rua, número' },
  { k: 'cidade', label: 'Cidade', placeholder: 'São Paulo' },
  { k: 'uf', label: 'UF', placeholder: 'SP' },
  { k: 'cep', label: 'CEP', placeholder: '00000-000' },
]

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export default function FichaHospital({ hosp, operadoras, onToast, onChanged }: {
  hosp: HospitalSelected
  /** Todas as operadoras cadastradas — origem do seletor de vínculo. */
  operadoras: OperadoraCard[]
  onToast: (m: string) => void
  onChanged: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPOS.map((c) => [c.k, str(hosp[c.k])])),
  )
  const [novaOp, setNovaOp] = useState('')

  const vinculadas: OperadoraVinculo[] = hosp.operadoras_nomes
    ?? (hosp.operadoras ?? []).map((k) => ({ key: k, nome: k }))
  const keysVinculadas = new Set(vinculadas.map((o) => o.key))
  const disponiveis = operadoras.filter((o) => !keysVinculadas.has(o.key))

  async function salvar() {
    setSalvando(true)
    try {
      // Campo vazio grava null: distingue "não informado" de string vazia.
      const patch = Object.fromEntries(
        CAMPOS.map((c) => [c.k, form[c.k].trim() || null]),
      )
      await salvarFichaHospital(hosp.key, patch)
      onToast('✓ Ficha atualizada')
      setEditando(false)
      onChanged()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) } finally { setSalvando(false) }
  }

  async function vincular() {
    if (!novaOp) return
    try {
      await vincularOperadora(hosp.key, novaOp)
      onToast('✓ Operadora vinculada')
      setNovaOp('')
      onChanged()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) }
  }

  async function desvincular(op: OperadoraVinculo) {
    if (!confirm(`Remover o vínculo do hospital com ${op.nome}?`)) return
    try {
      await desvincularOperadora(hosp.key, op.key)
      onToast('Vínculo removido')
      onChanged()
    } catch (e) { onToast(`Erro: ${(e as Error).message}`) }
  }

  return (
    <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
      {/* ── Operadoras atendidas ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Operadoras atendidas</div>
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>
            {vinculadas.length} vinculada{vinculadas.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="card-body">
          {vinculadas.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {vinculadas.map((o) => (
                <div key={o.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 6px',
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                }}>
                  <OpAvatar opKey={o.key} />
                  <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600 }}>{o.nome}</span>
                  <button
                    onClick={() => desvincular(o)}
                    title={`Remover vínculo com ${o.nome}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)', padding: '0 2px' }}
                  >✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 'var(--t-sm)', color: 'var(--muted)', marginBottom: 12 }}>
              Nenhuma operadora vinculada.
            </div>
          )}

          {disponiveis.length > 0 && (
            <div className="row" style={{ gap: 8 }}>
              <select
                className="bm-input"
                value={novaOp}
                onChange={(e) => setNovaOp(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Vincular outra operadora…</option>
                {disponiveis.map((o) => (
                  <option key={o.key} value={o.key}>{o.nome}</option>
                ))}
              </select>
              <button className="btn btn-outline btn-sm" onClick={vincular} disabled={!novaOp}>
                Vincular
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Dados cadastrais ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Dados cadastrais</div>
          {!editando && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditando(true)}>Editar</button>
          )}
        </div>
        <div className="card-body">
          {editando ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {CAMPOS.map((c) => (
                  <div key={c.k} className="config-field">
                    <label>{c.label}</label>
                    {c.opcoes ? (
                      <SelectRegiao
                        value={form[c.k]}
                        onChange={(v) => setForm((f) => ({ ...f, [c.k]: v }))}
                      />
                    ) : (
                      <input
                        type={c.tipo || 'text'}
                        className="bm-input"
                        placeholder={c.placeholder}
                        value={form[c.k]}
                        onChange={(e) => setForm((f) => ({ ...f, [c.k]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setEditando(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px 16px' }}>
              {CAMPOS.map((c) => (
                <div key={c.k}>
                  <div className="uppercase" style={{ fontSize: 10, letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)' }}>{c.label}</div>
                  <div style={{ fontSize: 'var(--t-sm)' }}>{str(hosp[c.k]) || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
