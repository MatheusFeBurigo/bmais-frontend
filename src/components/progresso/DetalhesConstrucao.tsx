// Janela "Resumo detalhado das atividades" do grupo Em construção da tela
// Progresso: o que está sendo feito nos módulos em obra.
//
// O conteúdo é escrito À MÃO por quem acompanha a obra, pela própria janela:
// o botão "+" abre um formulário com data, título e descrição. As atividades
// ficam no banco (tabela progresso_atividades, migration 0055), então todos
// que abrem a tela veem a mesma lista. Só a administração adiciona e remove;
// a diretoria lê.
import { useState, type FormEvent } from 'react'
import { LoadingState, Modal } from '../ui'
import {
  useApagarAtividadeProgresso, useAtividadesProgresso, useCriarAtividadeProgresso,
} from '../../hooks/useProgresso'

/** Hoje, no fuso local, em AAAA-MM-DD (o formato do <input type="date">). */
function hojeIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "2026-10-16" vira "16/10/2026". Por texto, e não por Date: um Date de data
 *  pura é meia-noite UTC, e no Brasil isso mostraria o dia anterior. */
function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-')
  return a && m && d ? `${d}/${m}/${a}` : iso
}

const IconMais = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" /><path d="M5 12h14" /></svg>
)

const IconLixeira = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
)

export default function DetalhesConstrucao({ onClose, podeEditar }: {
  onClose: () => void
  /** Só a administração adiciona e remove. Sem isto, a janela é de leitura. */
  podeEditar: boolean
}) {
  const atividades = useAtividadesProgresso()
  const criar = useCriarAtividadeProgresso()
  const apagar = useApagarAtividadeProgresso()

  const [adicionando, setAdicionando] = useState(false)
  const [data, setData] = useState(hojeIso)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  function limpar() {
    setData(hojeIso())
    setTitulo('')
    setDescricao('')
    setErro('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!data) return setErro('Informe a data.')
    if (!titulo.trim()) return setErro('Informe o título.')
    setErro('')
    criar.mutate({ data, titulo: titulo.trim(), descricao: descricao.trim() }, {
      onSuccess: () => { limpar(); setAdicionando(false) },
      onError: () => setErro('Não foi possível salvar. Tente de novo.'),
    })
  }

  function aoApagar(id: string, nome: string) {
    if (!window.confirm(`Remover a atividade "${nome}"?`)) return
    apagar.mutate(id)
  }

  const lista = atividades.data?.atividades ?? []

  return (
    <Modal title="Resumo detalhado das atividades" onClose={onClose} largura={640}>
      <div className="prg-detalhes">
        {podeEditar && !adicionando && (
          <button type="button" className="btn btn-outline btn-sm prg-ativ-mais"
            onClick={() => setAdicionando(true)}>
            <IconMais />
            Adicionar atividade
          </button>
        )}

        {podeEditar && adicionando && (
          <form className="prg-ativ-form" onSubmit={aoSalvar}>
            <div className="prg-ativ-campo prg-ativ-campo-data">
              <label htmlFor="prg-ativ-data">Data</label>
              <input id="prg-ativ-data" type="date" className="bm-input" value={data}
                disabled={criar.isPending} required
                onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="prg-ativ-campo">
              <label htmlFor="prg-ativ-titulo">Título</label>
              <input id="prg-ativ-titulo" type="text" className="bm-input" value={titulo}
                maxLength={200} disabled={criar.isPending} required autoFocus
                placeholder="O que foi feito"
                onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="prg-ativ-campo prg-ativ-campo-cheio">
              <label htmlFor="prg-ativ-descricao">Descrição</label>
              <textarea id="prg-ativ-descricao" className="bm-input" rows={4} value={descricao}
                maxLength={5000} disabled={criar.isPending}
                placeholder="Detalhes da atividade"
                onChange={(e) => setDescricao(e.target.value)} />
            </div>
            {erro && <p className="prg-ativ-erro" role="alert">{erro}</p>}
            <div className="prg-ativ-acoes">
              <button type="button" className="btn btn-outline btn-sm" disabled={criar.isPending}
                onClick={() => { limpar(); setAdicionando(false) }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={criar.isPending}>
                {criar.isPending ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {atividades.isLoading && <LoadingState label="Carregando atividades…" size={22} />}
        {atividades.isError && (
          <p className="prg-ativ-erro">Não foi possível carregar as atividades.</p>
        )}
        {atividades.isSuccess && lista.length === 0 && (
          <p className="prg-detalhes-vazio">Ainda não há atividades registradas.</p>
        )}

        {lista.length > 0 && (
          <ul className="prg-ativ-lista">
            {lista.map((a) => (
              <li className="prg-ativ" key={a.id}>
                <div className="prg-ativ-topo">
                  <span className="prg-ativ-data">{dataBr(a.data)}</span>
                  <h4 className="prg-ativ-titulo">{a.titulo}</h4>
                  {podeEditar && (
                    <button type="button" className="prg-ativ-apagar"
                      disabled={apagar.isPending}
                      onClick={() => aoApagar(a.id, a.titulo)}
                      title="Remover atividade" aria-label={`Remover ${a.titulo}`}>
                      <IconLixeira />
                    </button>
                  )}
                </div>
                {a.descricao && <p className="prg-ativ-descricao">{a.descricao}</p>}
                {a.criado_por && <span className="prg-ativ-autor">por {a.criado_por}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
