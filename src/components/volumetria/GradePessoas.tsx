// Bloco "Equipe": busca, ordem e a grade de cartões — quem tem área definida
// primeiro (na ordem que o backend já dá: sobrecarga → atenção → normal), quem
// não tem no fim, esmaecido.
import { useMemo, useState } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import CardPessoa from './CardPessoa'
import { ORDENS, maxHoras, normalizar, rotuloGrupo, type OrdemPessoas } from './volumetria.model'

export default function GradePessoas({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<OrdemPessoas>('carga')
  const rotulo = rotuloGrupo(grupo.papel)
  const maximo = useMemo(() => maxHoras(grupo), [grupo])

  const visiveis = useMemo(() => {
    const q = normalizar(busca)
    const lista = q
      ? grupo.pessoas.filter((p) => normalizar(p.nome).includes(q) || normalizar(p.email || '').includes(q))
      : grupo.pessoas
    if (ordem === 'nome') {
      return [...lista].sort((a, b) =>
        Number(a.sem_vinculo) - Number(b.sem_vinculo) || a.nome.localeCompare(b.nome, 'pt-BR'))
    }
    return lista
  }, [grupo.pessoas, busca, ordem])

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Equipe</div>
          <p className="card-sub">
            {grupo.pessoas.length} {grupo.pessoas.length === 1 ? rotulo.singular : rotulo.plural.toLowerCase()} · cada cartão mostra o que a pessoa vê no próprio quadro de Tarefas
          </p>
        </div>
        <div className="vol-toolbar">
          <input
            className="bm-input"
            style={{ fontSize: 'var(--t-sm)', width: 190 }}
            placeholder="Buscar pessoa…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label={`Buscar ${rotulo.singular}`}
          />
          <select
            className="bm-input bm-select"
            style={{ fontSize: 'var(--t-sm)' }}
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as OrdemPessoas)}
            aria-label="Ordenar por"
          >
            {ORDENS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <div className="vol-vazio">
          {grupo.pessoas.length === 0 ? `Nenhum ${rotulo.singular} cadastrado.` : 'Ninguém com esse nome.'}
        </div>
      ) : (
        <div className="vol-grade">
          {visiveis.map((p) => (
            <CardPessoa key={p.user_id} pessoa={p} grupo={grupo} maxHoras={maximo} onAbrir={onAbrir} />
          ))}
        </div>
      )}
    </div>
  )
}
