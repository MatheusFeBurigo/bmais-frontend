// Janela "Resumo detalhado das atividades" de UM módulo da tela Progresso: o
// que foi feito nele, aberta pelo botão do próprio módulo. Cada módulo tem o
// seu resumo (18/10/2026, migration 0056); antes era um só, no grupo Em
// construção, e as atividades de módulos diferentes se misturavam.
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

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** "2026-10-16" em UTC: só para contar dias, sem o fuso deslocar a data. */
function utc(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

function isoDe(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana do dia (a semana vai de segunda a domingo). */
function segundaDa(iso: string): string {
  const d = utc(iso)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return isoDe(d)
}

/** "12/10 a 18/10/2026": o ano só no fim, como se escreve. */
function rotuloSemana(segunda: string): string {
  const domingo = utc(segunda)
  domingo.setUTCDate(domingo.getUTCDate() + 6)
  return `${dataBr(segunda).slice(0, 5)} a ${dataBr(isoDe(domingo))}`
}

/** "Sexta, 16/10/2026". */
function rotuloDia(iso: string): string {
  return `${DIAS_SEMANA[utc(iso).getUTCDay()]}, ${dataBr(iso)}`
}

function contagem(n: number): string {
  return `${n} ${n === 1 ? 'atividade' : 'atividades'}`
}

interface Dia<T> { dia: string; itens: T[] }
interface Semana<T> { segunda: string; dias: Dia<T>[]; total: number }

/** Agrupa por semana e, dentro dela, por dia. Mantém a ordem recebida (da mais
 *  recente para a mais antiga), então a 1ª semana e o 1º dia são os últimos. */
function agrupar<T extends { data: string }>(lista: readonly T[]): Semana<T>[] {
  const semanas: Semana<T>[] = []
  for (const a of lista) {
    const dia = a.data.slice(0, 10)
    const segunda = segundaDa(dia)
    let s = semanas[semanas.length - 1]
    if (!s || s.segunda !== segunda) semanas.push(s = { segunda, dias: [], total: 0 })
    let d = s.dias[s.dias.length - 1]
    if (!d || d.dia !== dia) s.dias.push(d = { dia, itens: [] })
    d.itens.push(a)
    s.total += 1
  }
  return semanas
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

export default function ResumoAtividades({ modulo, onClose, podeEditar }: {
  /** Módulo do quadro: a janela lista e grava só as atividades dele. */
  modulo: { id: string; nome: string }
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
    criar.mutate({ moduloId: modulo.id, data, titulo: titulo.trim(), descricao: descricao.trim() }, {
      onSuccess: () => { limpar(); setAdicionando(false) },
      onError: () => setErro('Não foi possível salvar. Tente de novo.'),
    })
  }

  function aoApagar(id: string, nome: string) {
    if (!window.confirm(`Remover a atividade "${nome}"?`)) return
    apagar.mutate(id)
  }

  const lista = (atividades.data?.atividades ?? []).filter((a) => a.modulo_id === modulo.id)
  const semanas = agrupar(lista)
  // O último dia atualizado: nasce aberto, com a semana dele. O resto, fechado.
  const ultimoDia = semanas[0]?.dias[0]?.dia

  return (
    <Modal title="Resumo detalhado das atividades" onClose={onClose} largura={640}>
      <div className="prg-detalhes">
        {/* De qual módulo é a lista: o título da janela é o mesmo em todos. */}
        <div className="prg-resumo-modulo">
          <span className="prg-modulo-cod">{modulo.id}</span>
          <span className="prg-resumo-modulo-nome">{modulo.nome}</span>
        </div>

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
          <p className="prg-detalhes-vazio">Ainda não há atividades registradas neste módulo.</p>
        )}

        {/* Semana > dia > atividades, cada nível recolhível. Abertos só a
            semana e o dia mais recentes: o histórico não empurra para baixo o
            que acabou de ser feito. `open` só define o estado inicial; depois
            quem abre e fecha é a pessoa. */}
        {semanas.map((s) => (
          <details className="prg-semana" key={s.segunda}
            open={s.dias.some((d) => d.dia === ultimoDia)}>
            <summary className="prg-semana-cab">
              <span className="prg-semana-nome">Semana de {rotuloSemana(s.segunda)}</span>
              <span className="prg-semana-total">{contagem(s.total)}</span>
            </summary>
            {s.dias.map((d) => (
              <details className="prg-dia" key={d.dia} open={d.dia === ultimoDia}>
                <summary className="prg-dia-cab">
                  <span className="prg-dia-nome">{rotuloDia(d.dia)}</span>
                  <span className="prg-dia-total">{d.itens.length}</span>
                </summary>
                <ul className="prg-ativ-lista">
                  {d.itens.map((a) => (
                    <li className="prg-ativ" key={a.id}>
                      <div className="prg-ativ-topo">
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
              </details>
            ))}
          </details>
        ))}
      </div>
    </Modal>
  )
}
