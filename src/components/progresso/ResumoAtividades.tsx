// Janela "Resumo detalhado das atividades" de UM módulo da tela Progresso: o
// que foi feito nele, aberta pelo botão do próprio módulo. Cada módulo tem o
// seu resumo (18/10/2026, migration 0056); antes era um só, no grupo Em
// construção, e as atividades de módulos diferentes se misturavam.
//
// O conteúdo é escrito À MÃO por quem acompanha a obra, pela própria janela:
// o botão "+" abre um formulário com data, título e descrição. As atividades
// ficam no banco (tabela progresso_atividades, migration 0055), então todos
// que abrem a tela veem a mesma lista. Só a administração adiciona, edita e
// remove (o servidor aplica a mesma regra); a diretoria lê.
import { useId, useState, type FormEvent } from 'react'
import { LoadingState, Modal } from '../ui'
import {
  useApagarAtividadeProgresso, useAtividadesProgresso, useCriarAtividadeProgresso,
  useEditarAtividadeProgresso,
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

const IconLapis = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
)

interface CamposAtividade { data: string; titulo: string; descricao: string }

/** Formulário de uma atividade: o mesmo para adicionar e para editar. Guarda o
 *  rascunho; quem chama decide o que fazer com ele ao salvar. */
function FormAtividade({ inicial, salvando, erro, onSalvar, onCancelar }: {
  inicial: CamposAtividade
  salvando: boolean
  erro: string
  onSalvar: (campos: CamposAtividade) => void
  onCancelar: () => void
}) {
  // Ids únicos: a edição pode abrir com o formulário de adicionar na tela.
  const id = useId()
  const [data, setData] = useState(inicial.data)
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [descricao, setDescricao] = useState(inicial.descricao)
  const [aviso, setAviso] = useState('')

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    if (!data) return setAviso('Informe a data.')
    if (!titulo.trim()) return setAviso('Informe o título.')
    setAviso('')
    onSalvar({ data, titulo: titulo.trim(), descricao: descricao.trim() })
  }

  const mensagem = aviso || erro
  return (
    <form className="prg-ativ-form" onSubmit={aoEnviar}>
      <div className="prg-ativ-campo prg-ativ-campo-data">
        <label htmlFor={`${id}-data`}>Data</label>
        <input id={`${id}-data`} type="date" className="bm-input" value={data}
          disabled={salvando} required
          onChange={(e) => setData(e.target.value)} />
      </div>
      <div className="prg-ativ-campo">
        <label htmlFor={`${id}-titulo`}>Título</label>
        <input id={`${id}-titulo`} type="text" className="bm-input" value={titulo}
          maxLength={200} disabled={salvando} required autoFocus
          placeholder="O que foi feito"
          onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="prg-ativ-campo prg-ativ-campo-cheio">
        <label htmlFor={`${id}-descricao`}>Descrição</label>
        <textarea id={`${id}-descricao`} className="bm-input" rows={4} value={descricao}
          maxLength={5000} disabled={salvando}
          placeholder="Detalhes da atividade"
          onChange={(e) => setDescricao(e.target.value)} />
      </div>
      {mensagem && <p className="prg-ativ-erro" role="alert">{mensagem}</p>}
      <div className="prg-ativ-acoes">
        <button type="button" className="btn btn-outline btn-sm" disabled={salvando}
          onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

const IconLixeira = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
)

export default function ResumoAtividades({ modulo, onClose, podeEditar }: {
  /** Módulo do quadro: a janela lista e grava só as atividades dele. */
  modulo: { id: string; nome: string }
  onClose: () => void
  /** Só a administração adiciona, edita e remove. Sem isto, a janela é de leitura. */
  podeEditar: boolean
}) {
  const atividades = useAtividadesProgresso()
  const criar = useCriarAtividadeProgresso()
  const apagar = useApagarAtividadeProgresso()

  const editar = useEditarAtividadeProgresso()

  const [adicionando, setAdicionando] = useState(false)
  // Atividade aberta para edição (o id), ou null. Uma de cada vez.
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  function aoAdicionar(campos: CamposAtividade) {
    setErro('')
    criar.mutate({ moduloId: modulo.id, ...campos }, {
      onSuccess: () => setAdicionando(false),
      onError: () => setErro('Não foi possível salvar. Tente de novo.'),
    })
  }

  function aoEditar(id: string, campos: CamposAtividade) {
    setErro('')
    editar.mutate({ id, ...campos }, {
      onSuccess: () => setEditandoId(null),
      onError: () => setErro('Não foi possível salvar a edição. Tente de novo.'),
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
            onClick={() => { setErro(''); setEditandoId(null); setAdicionando(true) }}>
            <IconMais />
            Adicionar atividade
          </button>
        )}

        {podeEditar && adicionando && (
          <FormAtividade inicial={{ data: hojeIso(), titulo: '', descricao: '' }}
            salvando={criar.isPending} erro={erro} onSalvar={aoAdicionar}
            onCancelar={() => { setErro(''); setAdicionando(false) }} />
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
                  {d.itens.map((a) => podeEditar && editandoId === a.id ? (
                    // Em edição, o formulário toma o lugar da atividade: quem
                    // edita não perde de vista em que dia ela está.
                    <li className="prg-ativ" key={a.id}>
                      <FormAtividade inicial={{ data: a.data.slice(0, 10), titulo: a.titulo,
                        descricao: a.descricao ?? '' }}
                        salvando={editar.isPending} erro={erro}
                        onSalvar={(campos) => aoEditar(a.id, campos)}
                        onCancelar={() => { setErro(''); setEditandoId(null) }} />
                    </li>
                  ) : (
                    <li className="prg-ativ" key={a.id}>
                      <div className="prg-ativ-topo">
                        <h4 className="prg-ativ-titulo">{a.titulo}</h4>
                        {podeEditar && (
                          <button type="button" className="prg-ativ-acao"
                            disabled={editar.isPending}
                            onClick={() => { setErro(''); setAdicionando(false); setEditandoId(a.id) }}
                            title="Editar atividade" aria-label={`Editar ${a.titulo}`}>
                            <IconLapis />
                          </button>
                        )}
                        {podeEditar && (
                          <button type="button" className="prg-ativ-acao prg-ativ-apagar"
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
