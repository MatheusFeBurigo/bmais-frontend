// Combobox de convênio: digita para filtrar, escolhe um dos que os censos já
// trouxeram — ou escreve um que nunca apareceu.
//
// Valor ABERTO, ao contrário do HospitalCombobox. Hospital é cadastro fechado:
// escolher fora da lista é erro. Convênio é texto livre lido do PDF, e o próximo
// censo pode trazer um nome inédito — travar a escolha deixaria sem saída
// justamente o caso que se está corrigindo. Aqui a lista sugere e o campo aceita
// qualquer texto.
//
// Substituiu um `<datalist>`, que parecia a escolha óbvia e não serve: o menu é
// desenhado pelo sistema operacional (não dá para estilizar, e fica destoando do
// resto da tela) e o atributo `label` da `<option>`, que levaria a operadora de
// cada convênio, é ignorado pela maioria dos navegadores — a informação que
// motiva a lista simplesmente não aparecia.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConvenioVisto } from '../services/internacao.service'

const styles = `
.cc-wrap{position:relative}
.cc-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-lg);max-height:224px;overflow-y:auto;padding:4px}
.cc-opt{display:flex;align-items:baseline;gap:8px;padding:7px 10px;font-size:var(--t-sm);color:var(--ink-2);border-radius:6px;cursor:pointer}
.cc-opt:hover,.cc-opt.active{background:var(--primary-soft);color:var(--primary)}
.cc-opt-nome{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* A operadora de cada convênio: é o que a escolha decide de fato, então fica
   visível NA opção — escolher às cegas e descobrir depois de salvar inverteria a
   ordem do que o usuário está tentando resolver. */
.cc-opt-op{flex-shrink:0;font-size:var(--t-xs);color:var(--muted)}
.cc-opt.active .cc-opt-op{color:var(--primary-3)}
/* Convênio visto mas sem operadora: precisa se distinguir na lista, senão o
   usuário escolhe achando que resolveu e o alerta continua. */
.cc-opt-sem{flex-shrink:0;font-size:var(--t-xs);color:var(--warning-2)}
.cc-empty{padding:9px 10px;font-size:var(--t-sm);color:var(--muted);line-height:1.45}
.cc-mais{padding:7px 10px;font-size:var(--t-xs);color:var(--muted);border-top:1px solid var(--border-soft);margin-top:2px}
/* Cabecalho do recorte: diz de quem e a lista que esta sendo mostrada, para o
   usuario nao achar que sao todos os convenios do sistema. */
.cc-ctx{padding:6px 10px;font-size:var(--t-xs);color:var(--muted);border-bottom:1px solid var(--border-soft);margin-bottom:2px}
.cc-ctx b{color:var(--ink-2);font-weight:600}
/* Resultados de OUTRAS operadoras, atras de um clique: o recorte ajuda, mas nao
   pode esconder o que o usuario esta procurando. */
.cc-fora{width:100%;text-align:left;padding:7px 10px;border:0;border-top:1px solid var(--border-soft);margin-top:2px;background:none;font-family:inherit;font-size:var(--t-xs);color:var(--primary-3);cursor:pointer;border-radius:6px}
.cc-fora:hover{background:var(--primary-soft)}
/* Opcao de outra operadora: a etiqueta da operadora fica em destaque de aviso,
   porque escolhe-la MUDA a operadora do paciente. */
.cc-opt-outra{flex-shrink:0;font-size:var(--t-xs);color:var(--warning-2);font-weight:600}
/* Cadastrar o que esta escrito. Fica no PE do menu, depois das opcoes: o certo
   quase sempre esta na lista, e um botao de criar acima dela convidaria a
   duplicar convenio que ja existe. */
.cc-criar{display:flex;align-items:center;gap:6px;width:100%;text-align:left;padding:8px 10px;border:0;border-top:1px solid var(--border-soft);margin-top:2px;background:none;font-family:inherit;font-size:var(--t-sm);font-weight:600;color:var(--primary);cursor:pointer;border-radius:6px}
.cc-criar:hover{background:var(--primary-soft)}
.cc-criar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400;color:var(--ink-2)}
.cc-criar b{font-weight:600;color:var(--ink-1)}
`

const MAX_VISIVEIS = 50

/** Minúsculas, sem acento: "sao" casa com "São". */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function ConvenioCombobox({
  convenios, value, onChange, disabled, id, carregando, operadora, operadoraNome,
  onCadastrar,
}: {
  /** Convênios já vistos nos censos, com a operadora de cada um. */
  convenios: ConvenioVisto[]
  /** Key da operadora em contexto. Estando preenchida, a lista abre só com os
   *  convênios DELA — escolhendo Bradesco, só os convênios Bradesco. É o recorte
   *  que torna a lista utilizável: sem ele são dezenas de nomes de todas as
   *  operadoras, e o certo para este paciente está perdido no meio.
   *  Vazia = sem contexto, mostra todos. */
  operadora?: string | null
  /** Nome legível da operadora, para dizer na tela qual é o recorte. */
  operadoraNome?: string | null
  /** O texto do convênio. Livre: pode não estar na lista. */
  value: string
  /** Devolve o texto e, quando veio de uma escolha da lista, a operadora dela —
   *  é o que deixa a correção em um passo só. */
  onChange: (convenio: string, operadoraKey?: string | null) => void
  disabled?: boolean
  id?: string
  carregando?: boolean
  /** Oferece cadastrar o que está escrito, quando nenhum convênio conhecido tem
   *  esse nome. Ausente = a lista só sugere (é o comportamento de quem não pode
   *  cadastrar: o campo continua aceitando texto livre, como sempre aceitou). */
  onCadastrar?: (nome: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  // Mostrar tambem os de outras operadoras. Fica FALSO por padrao: o recorte e o
  // ponto do filtro. Volta ao padrao a cada busca nova (o efeito abaixo), senao
  // uma abertura ficaria valendo para todas as seguintes.
  const [verTodas, setVerTodas] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { visiveis, totalFiltrado, foraDoContexto } = useMemo(() => {
    // 1. Recorte pela operadora em contexto: escolhendo Bradesco, só convênios
    //    Bradesco. Estritamente os dela — os sem operadora TAMBÉM ficam de fora.
    //    Cheguei a incluí-los ("são os que precisam ser resolvidos"), e o teste
    //    contra os dados reais mostrou o erro: dos 17 convênios da base, 9 estão
    //    sem operadora, então o contexto Bradesco ainda listava UNIMED, Portomed
    //    e Hospitau — o oposto do recorte que se pediu. Um convênio sem operadora
    //    não é mais de Bradesco do que de qualquer outra; ele aparece no
    //    "ver de outras", junto com o resto do que o recorte escondeu.
    const doContexto = operadora
      ? convenios.filter((c) => c.operadora_key === operadora)
      : convenios

    // 2. Filtra pelo que está escrito, SEM a exceção do HospitalCombobox (lá, um
    //    item escolhido para de filtrar). Aqui o texto é o valor, não um espelho
    //    de uma seleção: se parasse de filtrar, a lista abriria inteira toda vez
    //    que o campo já tivesse um convênio válido.
    const q = normalizar(value)
    const base = q ? doContexto.filter((c) => normalizar(c.convenio).includes(q)) : doContexto

    // O que o recorte ESCONDEU e casaria com a busca. O recorte é uma ajuda, não
    // uma parede: se o usuário procura um convênio de outra operadora (porque o
    // paciente está na operadora errada, que é um dos problemas que esta tela
    // marca), esconder sem dizer nada faria parecer que o convênio não existe.
    // Tudo o que o recorte escondeu e casaria com a busca: de outras operadoras
    // E sem operadora. O recorte é uma ajuda, não uma parede — se o usuário
    // procura um convênio de outra operadora (porque o paciente está na errada,
    // que é um dos problemas que esta tela marca), esconder sem dizer nada faria
    // parecer que o convênio não existe.
    const escondidos = operadora
      ? convenios.filter((c) => c.operadora_key !== operadora
          && (!q || normalizar(c.convenio).includes(q)))
      : []

    return {
      visiveis: base.slice(0, MAX_VISIVEIS),
      totalFiltrado: base.length,
      foraDoContexto: escondidos,
    }
  }, [convenios, value, operadora])

  // Mantém o item ativo visível ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return
    const el = menuRef.current?.children[ativo] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [ativo, aberto])

  // O índice ativo tem de voltar ao topo quando a lista muda: digitando mais uma
  // letra, o item 7 de antes pode nem existir, e o Enter escolheria outro.
  useEffect(() => { setAtivo(0) }, [value])
  useEffect(() => { setVerTodas(false) }, [value, operadora])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // O que a lista mostra de fato.
  //
  // O recorte SE ABRE SOZINHO quando não sobrou nada nele e há resultado fora:
  // digitando "AME" com um paciente Bradesco, o recorte esvazia e, sem isto, a
  // lista ficava vazia sem nada para escolher — o campo parecia travado. Um
  // filtro que esconde tudo o que casa com a busca, sem oferecer o que achou, é
  // um beco sem saída. O recorte é ajuda, não trava.
  const abreSozinho = visiveis.length === 0 && foraDoContexto.length > 0
  const lista = (verTodas || abreSozinho) ? [...visiveis, ...foraDoContexto] : visiveis

  // O texto escrito JÁ é um convênio conhecido? Vale contra a lista inteira, não
  // contra o recorte: um convênio de outra operadora existe do mesmo jeito, e
  // oferecer "cadastrar" ali criaria o duplicado que a padronização acabou de
  // eliminar. Comparação normalizada (sem caixa, sem espaço repetido) — a mesma
  // do backend, senão "BRADESCO  SAUDE" digitado pareceria inédito.
  const escritoExiste = useMemo(() => {
    const alvo = normalizar(value)
    return !!alvo && convenios.some((c) => normalizar(c.convenio) === alvo)
  }, [convenios, value])

  // O convite a cadastrar só aparece com algo escrito e nada igual na lista.
  const podeCadastrar = Boolean(onCadastrar && value.trim() && !escritoExiste
    && !carregando)

  // Acabou de escolher: o `focus` que vier LOGO em seguida não reabre o menu.
  // A opção é escolhida no `mousedown` com `preventDefault`, e o `click`
  // correspondente cai no input (a opção já sumiu), focando-o e reabrindo o menu
  // que acabou de fechar. Mesma armadilha do HospitalCombobox.
  const acabouDeEscolher = useRef(false)

  function selecionar(c: ConvenioVisto) {
    acabouDeEscolher.current = true
    onChange(c.convenio, c.operadora_key)
    setAberto(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setAtivo((i) => Math.min(i + 1, lista.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto && lista[ativo]) {
      // Só intercepta o Enter com o menu aberto E um item sob o cursor: senão o
      // Enter continua sendo o do formulário, e quem digitou um convênio novo
      // não fica preso no campo.
      e.preventDefault()
      selecionar(lista[ativo])
    } else if (e.key === 'Escape' && aberto) {
      // Só fecha o menu; não deixa o Esc borbulhar e fechar a modal inteira.
      e.stopPropagation()
      setAberto(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="cc-wrap" ref={wrapRef}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-autocomplete="list"
          className="bm-input"
          placeholder={carregando ? 'Carregando convênios…' : 'Convênio do paciente'}
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(e) => { onChange(e.target.value); setAberto(true) }}
          onMouseDown={() => { acabouDeEscolher.current = false }}
          onFocus={() => {
            if (acabouDeEscolher.current) {
              acabouDeEscolher.current = false
              return
            }
            if (!disabled) setAberto(true)
          }}
          onKeyDown={onKey}
        />
        {aberto && !disabled && (
          <div className="cc-menu">
            {operadora && operadoraNome && (
              <div className="cc-ctx">
                {abreSozinho
                  // Quando o recorte se abre sozinho, dizer por quê: senão parece
                  // que o filtro simplesmente não funcionou.
                  ? <>Nenhum de <b>{operadoraNome}</b> com “{value}”. Mostrando os demais.</>
                  : <>Convênios de <b>{operadoraNome}</b></>}
              </div>
            )}
            <div ref={menuRef}>
              {lista.map((c, i) => (
                <div
                  key={c.convenio}
                  role="option"
                  aria-selected={i === ativo}
                  className={`cc-opt${i === ativo ? ' active' : ''}`}
                  onMouseEnter={() => setAtivo(i)}
                  // `preventDefault` no mousedown: sem ele o campo perde o foco
                  // antes do clique registrar.
                  onMouseDown={(e) => { e.preventDefault(); selecionar(c) }}
                >
                  <span className="cc-opt-nome">{c.convenio}</span>
                  {/* Com recorte ativo, a operadora só é dita quando DIFERE do
                      contexto: repeti-la em cada linha ("Bradesco Saúde") é ruído
                      numa lista que já se anuncia como sendo dela. O que precisa
                      saltar é a exceção — escolher esta opção muda a operadora
                      do paciente. */}
                  {c.operadora_key && operadora && c.operadora_key !== operadora
                    ? <span className="cc-opt-outra">{c.operadora_nome || c.operadora_key}</span>
                    : !c.operadora_key
                      ? <span className="cc-opt-sem">sem operadora</span>
                      : !operadora && c.operadora_nome
                        ? <span className="cc-opt-op">{c.operadora_nome}</span>
                        : null}
                </div>
              ))}
            </div>
            {lista.length === 0 && (
              <div className="cc-empty">
                {convenios.length === 0
                  ? 'Nenhum convênio registrado ainda.'
                  : foraDoContexto.length > 0
                    // O caso que o recorte cria: existe, mas não é desta
                    // operadora. Dizer isso é o que impede o usuário de concluir
                    // que o convênio não está cadastrado.
                    ? `Nenhum convênio de ${operadoraNome ?? 'desta operadora'} com “${value}”.`
                    : podeCadastrar
                      // Com o botão de cadastrar logo abaixo, repetir "pode
                      // escrever assim mesmo" ofereceria o caminho pior (texto
                      // solto, sem operadora) ao lado do melhor.
                      ? `Nenhum convênio conhecido com “${value}”.`
                      : `Nenhum convênio conhecido com “${value}”. Pode escrever assim mesmo.`}
              </div>
            )}
            {/* A saída do recorte. Sem ela o filtro viraria uma parede: o
                paciente pode estar na operadora errada — que é um dos problemas
                que esta tela marca — e aí o convênio certo está justamente fora
                do contexto. */}
            {!verTodas && !abreSozinho && foraDoContexto.length > 0 && (
              <button type="button" className="cc-fora"
                      onMouseDown={(e) => { e.preventDefault(); setVerTodas(true) }}>
                Ver os outros {foraDoContexto.length} convênios
              </button>
            )}
            {!verTodas && !abreSozinho && totalFiltrado > visiveis.length && (
              <div className="cc-mais">
                Mostrando {visiveis.length} de {totalFiltrado}. Digite para refinar.
              </div>
            )}
            {/* Cadastrar o que está escrito. É a saída do caso que a lista não
                resolve: o convênio do PDF não existe em lugar nenhum, e sem
                isto o usuário só podia deixá-lo como texto solto — sem
                operadora, e portanto sem as regras que regem o paciente.
                `mousedown` com `preventDefault` pelo mesmo motivo das opções:
                sem ele o campo perde o foco antes de o clique registrar. */}
            {podeCadastrar && (
              <button type="button" className="cc-criar"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setAberto(false)
                        onCadastrar?.(value.trim())
                      }}>
                + Cadastrar <span><b>{value.trim()}</b> como convênio novo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
