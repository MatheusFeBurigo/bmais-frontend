// Ficha cadastral do hospital (edição), usada na tela Operações.
//
// Excluir NÃO fica aqui: é um clique no X da própria linha da lista, com
// confirmação inline — abrir a ficha inteira para chegar num botão de apagar
// era caminho longo demais para uma ação simples.
//
// A tela Configurações também edita esta ficha, mas cercada de regras de SLA e
// da carteira de pacientes — coisas do gestor/diretor. Aqui fica só o cadastro,
// que é o que o analista mantém.
import { useEffect, useState } from 'react'
import type { Hospital } from '../../types/api'
import { LoadingState, Modal } from '../ui'
import { salvarFichaHospital } from '../../services/configuracoes.service'
import { useHospital } from '../../hooks/useHospital'
import SelectRegiao from '../SelectRegiao'

// Campos livres da ficha, na ordem em que aparecem. `nome` fica fora: é o
// identificador visível do hospital e ganha destaque próprio no topo.
type CampoFicha = keyof Pick<Hospital,
  'cnpj' | 'telefone' | 'email' | 'endereco' | 'cidade' | 'uf' | 'cep' | 'regiao' | 'observacoes'>

const CAMPOS: readonly { key: CampoFicha; label: string; placeholder?: string; largura?: 'meia' }[] = [
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', largura: 'meia' },
  { key: 'telefone', label: 'Telefone', placeholder: '(00) 0000-0000', largura: 'meia' },
  { key: 'email', label: 'E-mail', placeholder: 'contato@hospital.com' },
  { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número' },
  { key: 'cidade', label: 'Cidade', largura: 'meia' },
  { key: 'uf', label: 'UF', placeholder: 'SP', largura: 'meia' },
  { key: 'cep', label: 'CEP', placeholder: '00000-000', largura: 'meia' },
  { key: 'regiao', label: 'Região', largura: 'meia' },
]

const TODOS: readonly CampoFicha[] = [...CAMPOS.map((c) => c.key), 'observacoes']

function fichaParaForm(h: Hospital): Record<string, string> {
  return Object.fromEntries(TODOS.map((k) => [k, typeof h[k] === 'string' ? (h[k] as string) : '']))
}

const labelStyle = {
  display: 'block', marginBottom: 4, fontSize: 10, textTransform: 'uppercase' as const,
  letterSpacing: '.1em', fontWeight: 600 as const, color: 'var(--muted)',
}

interface Props {
  hospital: { key: string; nome: string }
  /** Nome da operadora em cujo grupo o hospital foi aberto (contexto no título). */
  opNome: string
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}

export default function HospitalFichaModal({ hospital, opNome, onClose, onToast, onDone }: Props) {
  // A listagem traz só key/nome: a ficha completa vem de GET /api/hospital/{key}
  // e preenche o formulário, que então é salvo por inteiro. Campo esvaziado
  // grava null, ou seja, apagar um telefone apaga de fato.
  const { data: ficha, isLoading, isError } = useHospital(hospital.key)
  const [nome, setNome] = useState(hospital.nome)
  const [campos, setCampos] = useState<Record<string, string> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ficha && campos === null) {
      setCampos(fichaParaForm(ficha))
      setNome(ficha.nome)
    }
  }, [ficha, campos])

  async function salvar() {
    if (!campos) return
    const n = nome.trim()
    if (!n) { onToast('Informe o nome do hospital'); return }
    setSaving(true)
    try {
      const patch: Record<string, string | null> = { nome: n }
      for (const k of TODOS) patch[k] = campos[k]?.trim() || null
      await salvarFichaHospital(hospital.key, patch)
      onToast('✓ Hospital atualizado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: string) => setCampos((cur) => ({ ...(cur ?? {}), [k]: v }))

  return (
    <Modal title={`${hospital.nome} · ${opNome}`} onClose={onClose}>
      {isError ? (
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          Não foi possível abrir a ficha. Feche e tente de novo.
        </p>
      ) : isLoading || !campos ? (
        <LoadingState />
      ) : (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input type="text" className="bm-input" value={nome}
            onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CAMPOS.map((c) => (
            <div key={c.key} style={{ gridColumn: c.largura === 'meia' ? 'span 1' : 'span 2' }}>
              <label style={labelStyle}>{c.label}</label>
              {c.key === 'regiao' ? (
                <SelectRegiao value={campos.regiao ?? ''} onChange={(v) => set('regiao', v)} />
              ) : (
                <input
                  type="text"
                  className="bm-input"
                  placeholder={c.placeholder}
                  value={campos[c.key] ?? ''}
                  onChange={(e) => set(c.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Observações</label>
            <textarea
              className="bm-input"
              rows={2}
              value={campos.observacoes ?? ''}
              onChange={(e) => set('observacoes', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={salvar} disabled={saving || !nome.trim()}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
      )}
    </Modal>
  )
}
