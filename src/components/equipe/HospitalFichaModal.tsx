// Ficha cadastral do hospital (edição), usada na tela Operações.
//
// Excluir NÃO fica aqui: é um clique no X da própria linha da lista, com
// confirmação inline — abrir a ficha inteira para chegar num botão de apagar
// era caminho longo demais para uma ação simples.
//
// A tela Configurações também edita esta ficha, mas cercada de regras de SLA e
// da carteira de pacientes — coisas do gestor/diretor. Aqui fica só o cadastro,
// que é o que o analista mantém.
import { useState } from 'react'
import type { Hospital } from '../../types/api'
import { Modal } from '../ui'
import { salvarFichaHospital } from '../../services/configuracoes.service'

// Campos livres da ficha, na ordem em que aparecem. `nome` fica fora: é o
// identificador visível do hospital e ganha destaque próprio no topo.
const CAMPOS: readonly { key: keyof Hospital; label: string; placeholder?: string; largura?: 'meia' }[] = [
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', largura: 'meia' },
  { key: 'telefone', label: 'Telefone', placeholder: '(00) 0000-0000', largura: 'meia' },
  { key: 'email', label: 'E-mail', placeholder: 'contato@hospital.com' },
  { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número' },
  { key: 'cidade', label: 'Cidade', largura: 'meia' },
  { key: 'uf', label: 'UF', placeholder: 'SP', largura: 'meia' },
  { key: 'cep', label: 'CEP', placeholder: '00000-000', largura: 'meia' },
  { key: 'regiao', label: 'Região', placeholder: 'Capital, Interior…', largura: 'meia' },
]

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
  // A ficha completa não vem na listagem (que traz só key/nome), então o estado
  // começa com o que se sabe e os campos livres entram vazios; salvar envia
  // apenas o que foi preenchido, sem apagar o que não foi tocado.
  const [nome, setNome] = useState(hospital.nome)
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function salvar() {
    const n = nome.trim()
    if (!n) { onToast('Informe o nome do hospital'); return }
    setSaving(true)
    try {
      // Só os campos com conteúdo: um PATCH com strings vazias apagaria dados
      // que já estão gravados e que esta tela não carregou.
      const patch: Record<string, string> = { nome: n }
      for (const [k, v] of Object.entries(campos)) {
        if (v.trim()) patch[k] = v.trim()
      }
      await salvarFichaHospital(hospital.key, patch)
      onToast('✓ Hospital atualizado')
      onDone()
    } catch (e) {
      onToast(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`${hospital.nome} · ${opNome}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input type="text" className="bm-input" value={nome}
            onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CAMPOS.map((c) => (
            <div key={String(c.key)} style={{ gridColumn: c.largura === 'meia' ? 'span 1' : 'span 2' }}>
              <label style={labelStyle}>{c.label}</label>
              <input
                type="text"
                className="bm-input"
                placeholder={c.placeholder}
                value={campos[String(c.key)] ?? ''}
                onChange={(e) => setCampos((cur) => ({ ...cur, [String(c.key)]: e.target.value }))}
              />
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Observações</label>
            <textarea
              className="bm-input"
              rows={2}
              value={campos.observacoes ?? ''}
              onChange={(e) => setCampos((cur) => ({ ...cur, observacoes: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--muted)' }}>
          Campos em branco são mantidos como já estão. Preencha só o que quiser alterar.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={salvar} disabled={saving || !nome.trim()}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
