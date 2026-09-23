// Bloco "Equipe": busca, ordem e a grade de cartões — quem tem área definida
// primeiro (na ordem que o backend já dá: sobrecarga → atenção → normal), quem
// não tem no fim, esmaecido.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { VolumetriaGrupo } from '../../types/api'
import CardPessoa from './CardPessoa'
import { ORDENS, maxHoras, normalizar, rotuloGrupo, type OrdemPessoas } from './volumetria.model'

// Mesmo desenho da lupa das Movimentações: um só símbolo de busca no sistema.
const IconBusca = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export default function GradePessoas({ grupo, onAbrir }: {
  grupo: VolumetriaGrupo
  onAbrir: (userId: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<OrdemPessoas>('carga')
  // A busca nasce fechada (só a lupa): a equipe cabe na tela e o campo vazio
  // só ocupava espaço ao lado do seletor de ordem.
  const [aberta, setAberta] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  // Abriu pelo clique na lupa: o cursor já vai para o campo.
  useEffect(() => {
    if (aberta) campo.current?.focus()
  }, [aberta])

  // Fecha ao sair do campo, mas só com a busca vazia: com texto digitado, o
  // campo tem de continuar visível, senão o filtro fica ativo e escondido.
  function aoSair() {
    if (!busca.trim()) setAberta(false)
  }

  function limpar() {
    setBusca('')
    setAberta(false)
  }
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
          <div className={`vol-busca${aberta ? ' aberta' : ''}`}>
            <input
              ref={campo}
              className="bm-input"
              placeholder="Buscar pessoa…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onBlur={aoSair}
              onKeyDown={(e) => { if (e.key === 'Escape') limpar() }}
              // Fechada, o campo sai da navegação por teclado e de leitores de
              // tela: quem chega pelo Tab encontra a lupa, que o abre.
              tabIndex={aberta ? 0 : -1}
              aria-hidden={!aberta}
              aria-label={`Buscar ${rotulo.singular}`}
            />
            <button
              type="button"
              className="vol-busca-btn"
              onClick={() => (aberta ? limpar() : setAberta(true))}
              aria-expanded={aberta}
              aria-label={aberta ? 'Fechar a busca' : `Buscar ${rotulo.singular}`}
              title={aberta ? 'Fechar a busca' : `Buscar ${rotulo.singular}`}
            >
              {IconBusca}
            </button>
          </div>
          <select
            className="bm-input bm-select"
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
