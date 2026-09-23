// Formulário: escolher um hospital para a escala de um profissional (selects
// encadeados operadora → hospital → serviço). Extraído de pages/Equipe.tsx.
//
// Ele NÃO grava: emite a escolha em `onAdicionar` e quem chama decide o que
// fazer com ela. A ficha do profissional manda para a API na hora; a modal de
// cadastro guarda numa lista, porque o profissional ainda não existe quando
// os hospitais são escolhidos. O mesmo formulário nos dois lugares é o que
// faz "escolher hospitais no nascimento" ter a mesma cara de "ajustar depois".
import { useState } from 'react'
import { useHospitais } from '../../hooks/useEquipe'
import type { EntradaEscala } from '../../services/escala.service'
import { SERVICOS } from './equipe.styles'

export default function FormEscala({
  opsLista, onAdicionar, onClose, onToast, aposAdicionar = 'fechar', rotuloBotao = 'Adicionar',
}: {
  opsLista: Array<{ key: string; nome: string }>
  /** Recebe a escolha. Lançar (rejeitar) mantém o formulário aberto com o toast de erro. */
  onAdicionar: (entrada: EntradaEscala) => Promise<void> | void
  /** Sem `onClose` o formulário não tem "Cancelar": é o caso de quando ele fica
   *  sempre visível dentro de outro formulário (a modal de cadastro). */
  onClose?: () => void
  onToast: (m: string) => void
  /** Depois de adicionar: `fechar` (ficha, um por vez) ou `limpar` só o
   *  hospital, mantendo operadora e serviço para a próxima escolha (cadastro,
   *  onde a pessoa costuma incluir vários da mesma operadora em sequência). */
  aposAdicionar?: 'fechar' | 'limpar'
  rotuloBotao?: string
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
      await onAdicionar({ hospital_key: hospKey, hospital_nome: hospNome, operadora_key: op, servico })
      if (aposAdicionar === 'fechar') onClose?.()
      else setHosp('')
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
          {onClose && <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>}
          <button type="button" className="btn btn-primary btn-sm" onClick={adicionar} disabled={saving}>{saving ? 'Adicionando…' : rotuloBotao}</button>
        </div>
      </div>
    </div>
  )
}
