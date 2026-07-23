// Lista de escala do profissional, agrupada por operadora. Extraída de pages/Equipe.tsx.
import type { Escala } from '../../types/api'
import { removerEscala } from '../../services/escala.service'
import { SERVICO_LABEL } from './equipe.styles'
import { IconX } from './icons'

export default function EscalaList({ escala, onToast, onChanged }: { escala: Escala[]; onToast: (m: string) => void; onChanged: () => void }) {
  if (escala.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: 'var(--t-sm)', padding: '10px 0' }}>Sem escala cadastrada neste sistema.</div>
  }

  async function remover(id: number) {
    if (!confirm('Remover este hospital da escala?')) return
    try {
      await removerEscala(id)
      onToast('Removido da escala')
      onChanged()
    } catch (err) {
      onToast(`Erro: ${(err as Error).message}`)
    }
  }

  const grupos: Array<{ op: string; itens: Escala[] }> = []
  for (const e of escala) {
    const last = grupos[grupos.length - 1]
    if (last && last.op === e.operadora_key) last.itens.push(e)
    else grupos.push({ op: e.operadora_key, itens: [e] })
  }

  return (
    <>
      {grupos.map((g) => (
        <div key={g.op} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{g.op.toUpperCase()}</div>
          {g.itens.map((e) => (
            <div key={e.id} className="escala-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fw-6 truncate" style={{ fontSize: 'var(--t-sm)' }}>{e.hospital_nome}</div>
                <div style={{ fontSize: 'var(--t-xs)', color: 'var(--muted)' }}>{SERVICO_LABEL[e.servico] || e.servico}</div>
              </div>
              <span className="servico-badge">{e.servico}</span>
              <button className="escala-remove" onClick={() => remover(e.id)} title="Remover">{IconX}</button>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
