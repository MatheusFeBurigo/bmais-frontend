// Abas por operadora na conferência de um censo misto.
//
// Um censo é do HOSPITAL, e o hospital atende vários convênios: o mesmo PDF
// traz 13 pacientes da CarePlus, 92 da Bradesco, 4 da Mediservice. Cada um foi
// gravado na operadora do próprio convênio, que é o certo — mas a tela só
// AVISAVA isso, em três faixas âmbar seguidas ("o convênio de 92 pacientes é da
// Bradesco Saúde, e não da careplus no envio"), e depois mostrava uma lista só,
// com os 112 embaralhados.
//
// O aviso dizia o número e escondia as pessoas. Quem confere um censo contra o
// PDF precisa do contrário: ver a relação de quem foi para cada operadora, para
// bater com a folha que tem na mão. Aqui o agrupamento vira NAVEGAÇÃO: uma aba
// por operadora, a lista embaixo filtrada pela aba.
//
// Sem legenda. Houve uma frase acima das abas ("este censo trouxe pacientes de
// 4 operadoras… confira aba por aba"), e ela foi removida: as abas já mostram
// quais são as operadoras e quantos pacientes cada uma tem, então a frase
// gastava três linhas para dizer o que estava desenhado logo abaixo dela.
//
// As abas só nascem com 2+ operadoras no arquivo. Com uma só (o caso comum) não
// há agrupamento a fazer, e uma aba única seria um controle inerte ocupando a
// linha para não dizer nada.
//
// Forma: abas com base sublinhada, penduradas numa régua horizontal. Não
// pílulas — nesta tela a pílula já é o vocabulário do FILTRO opcional ("Ver 110
// marcados", "Detalhes", a data do censo), e usar a mesma forma aqui diria que
// as abas são mais um filtro que se liga e desliga. Elas não são: dividem o
// censo inteiro em partes, e uma delas está sempre valendo.

import type { PacienteGravado, UploadCensoResult } from '../../types/api'
import { varsOperadora } from '../../lib/coresOperadora'
import { plural } from './comuns'

export const abasOperadoraStyles = `
/* Barra de abas: uma RÉGUA horizontal com a lista pendurada nela. A régua (a
   borda de baixo, que atravessa a linha inteira) é o que faz as abas se lerem
   como abas — sem ela, botões lado a lado são só botões, e nada indica que o
   que está embaixo pertence ao que está selecionado em cima.
   A versão anterior usava pílulas: forma errada aqui, porque nesta tela pílula
   já significa FILTRO opcional ("ver marcados", "Detalhes"), e estas abas não
   filtram um extra — elas dividem o censo inteiro em partes. */
.up-abas{display:flex;align-items:stretch;gap:2px;flex-wrap:wrap;border-bottom:2px solid var(--border)}
/* Cada aba: retângulo com a base viva, no tamanho de leitura da tela (t-md, o
   mesmo de um título de card) — a t-xs anterior tinha 10,5px e punha o nome da
   operadora entre os menores textos da página, quando ele é o que governa tudo
   o que está listado abaixo.
   O -2px de margem faz a base da aba cair EM CIMA da régua, e não abaixo dela:
   é assim que a aba ativa "abre" um vão na linha e se conecta ao conteúdo. */
.up-aba{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;margin-bottom:-2px;border:0;border-bottom:2px solid transparent;background:none;font-family:inherit;font-size:var(--t-md);font-weight:500;color:var(--muted);cursor:pointer;transition:color .12s,border-color .12s,background .12s}
.up-aba:hover{color:var(--ink-2);background:var(--op-fundo,var(--surface-3));border-bottom-color:var(--border-strong)}
.up-aba:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18);border-radius:var(--r-xs) var(--r-xs) 0 0}
/* Ativa: base e texto na cor da OPERADORA (ver lib/coresOperadora.ts), para o
   bloco inteiro se reconhecer pela mancha antes da leitura. A cor não é o único
   sinal — o peso sobe junto (500→700) e o nome está escrito na própria aba,
   então quem não distingue as matizes continua vendo qual está valendo.
   As variáveis --op-* vêm por style inline em cada aba; o fallback cobre a aba
   "Todos", que não é de operadora nenhuma. */
.up-aba.ativa{color:var(--op-ink,var(--primary-3));font-weight:700;border-bottom-color:var(--op-cor,var(--primary-3))}
/* Ponto da cor da marca em TODAS as abas de operadora, inclusive inativas: é o
   que permite achar "a linha vermelha da Bradesco" sem ler a barra inteira. */
.up-aba-cor{width:7px;height:7px;border-radius:50%;background:var(--op-cor);flex-shrink:0}
/* A contagem em mono: os números se comparam entre abas ("92 aqui, 13 ali"), e
   alinhados na mesma métrica a diferença se lê sem contar dígito. */
.up-aba-n{font-family:var(--font-mono);font-weight:700;font-size:var(--t-sm);padding:1px 7px;border-radius:99px;background:var(--surface-3);color:var(--ink-3)}
.up-aba.ativa .up-aba-n{background:var(--op-cor,var(--primary-3));color:#fff}
/* A aba da operadora ESCOLHIDA no envio recebe um anel em volta do ponto: num
   censo em que a maioria foi para outra operadora, é o que responde "e o que eu
   pedi, quantos foram?" sem procurar o nome na barra. Um anel, e não um segundo
   ponto ao lado, porque o ponto da cor já está ali — dois pontos na mesma aba
   seriam lidos como dois estados diferentes. */
.up-aba-cor.escolhida{box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--op-cor)}
/* A lista fica PENDURADA na régua: o painel do cartão separa seus blocos com
   10px de respiro, e esse vão entre a aba ativa e a tabela desfazia justamente
   a ligação que a aba existe para afirmar ("estas linhas são desta operadora").
   O seletor alcança o irmão imediato, então só a lista logo abaixo das abas
   perde o respiro — os alertas e o resto do painel seguem espaçados. */
.up-abas-bloco + *{margin-top:-10px}
/* Cantos de cima retos: a lista encosta na régua e uma curva ali abriria uma
   fresta entre a aba ativa e o conteúdo dela. */
.up-abas-bloco + * .up-lista-pac{border-top-left-radius:0;border-top-right-radius:0}
`

/** Um grupo de pacientes de um arquivo, por operadora de gravação. */
export interface GrupoOperadora {
  /** `key` do cadastro. `''` = o paciente foi gravado sem operadora nenhuma. */
  key: string
  nome: string
  emLeito: PacienteGravado[]
  comAlta: PacienteGravado[]
  total: number
}

/** Chave da aba "Todos" — não colide com key de operadora (que nunca é vazia
 *  nem tem espaço), e é o estado inicial da conferência: quem abre o cartão
 *  quer ver o censo inteiro, como ele veio. */
export const ABA_TODOS = '\u0000todos'

/** Nome legível de cada `operadora_key` presente no arquivo.
 *
 *  Três fontes, nesta ordem: o cadastro (é o nome oficial), o que o backend
 *  mandou junto das divergências (chega mesmo quando o cadastro não veio para a
 *  tela) e, por fim, a própria key. A key crua é feia ("careplus"), mas é
 *  melhor que "—": ela identifica a operadora, e este é um caso que só acontece
 *  com dado incompleto. */
function nomesDasOperadoras(
  res: UploadCensoResult,
  operadoras?: { key: string; nome: string }[],
): Map<string, string> {
  const nomes = new Map<string, string>()
  for (const d of res.operadoras_divergentes ?? []) {
    if (d.operadora_nome) nomes.set(d.operadora_key, d.operadora_nome)
  }
  // O cadastro por último, para vencer: é a grafia oficial da operadora.
  for (const o of operadoras ?? []) nomes.set(o.key, o.nome)
  return nomes
}

/** Agrupa os pacientes de um arquivo pela operadora em que FORAM GRAVADOS.
 *
 *  A fonte é `operadora_key` de cada paciente, e não a lista
 *  `operadoras_divergentes` do resultado: aquela é uma AMOSTRA (o backend manda
 *  até 5 nomes por operadora, para a resposta do upload não virar um despejo de
 *  fichas), e abas montadas sobre uma amostra mostrariam 5 dos 92 pacientes da
 *  Bradesco — exatamente o vazio que estas abas existem para preencher.
 *
 *  Recebe as listas JÁ passadas pelas edições e remoções da tela (leitoVisto /
 *  altaVista do cartão): corrigir a operadora de um paciente na modal tem de
 *  movê-lo de aba na hora, e não ao recarregar. */
export function agruparPorOperadora(
  emLeito: PacienteGravado[],
  comAlta: PacienteGravado[],
  res: UploadCensoResult,
  operadoras?: { key: string; nome: string }[],
): GrupoOperadora[] {
  const nomes = nomesDasOperadoras(res, operadoras)
  const grupos = new Map<string, GrupoOperadora>()

  const acumular = (lista: PacienteGravado[], deAlta: boolean) => {
    for (const p of lista) {
      const key = (p.operadora_key ?? '').trim()
      let g = grupos.get(key)
      if (!g) {
        g = {
          key,
          // Sem operadora não é um erro a esconder: o paciente entrou e alguém
          // vai precisar dizer de quem ele é. A aba o mantém visível em vez de
          // diluí-lo entre os demais.
          nome: key ? (nomes.get(key) ?? key) : 'Sem operadora',
          emLeito: [],
          comAlta: [],
          total: 0,
        }
        grupos.set(key, g)
      }
      if (deAlta) g.comAlta.push(p)
      else g.emLeito.push(p)
      g.total += 1
    }
  }
  acumular(emLeito, false)
  acumular(comAlta, true)

  // A operadora ESCOLHIDA no envio vem primeiro, mesmo sendo minoria: é a
  // referência de quem enviou ("pedi careplus"), e achá-la no meio da barra,
  // ordenada por volume, obrigava a ler nome por nome. Depois dela, as maiores
  // — num censo misto é o tamanho do grupo que decide o que se confere antes.
  // "Sem operadora" fecha a fila: é o resíduo, não um destino.
  const escolhida = (res.operadora_escolhida ?? '').trim()
  // Peso explícito em vez de uma cadeia de comparações: 0 = a escolhida no
  // envio, 1 = as demais operadoras, 2 = o resíduo sem operadora. Dentro do
  // mesmo peso, o maior grupo primeiro.
  const peso = (g: GrupoOperadora) => {
    if (escolhida && g.key === escolhida) return 0
    return g.key ? 1 : 2
  }
  return [...grupos.values()].sort((a, b) => peso(a) - peso(b) || b.total - a.total)
}

export function AbasOperadora({ grupos, ativa, onAba, escolhida, total }: {
  grupos: GrupoOperadora[]
  /** Key da aba ativa, ou `ABA_TODOS`. */
  ativa: string
  onAba: (key: string) => void
  /** Operadora escolhida no passo 1 do envio, marcada com um ponto. */
  escolhida?: string | null
  /** Quantos pacientes o arquivo tem ao todo (a aba "Todos"). */
  total: number
}) {
  const chave = (escolhida ?? '').trim()

  return (
    <div className="up-abas-bloco">
      <div className="up-abas" role="tablist" aria-label="Operadoras deste censo">
        <button
          type="button"
          role="tab"
          aria-selected={ativa === ABA_TODOS}
          className={`up-aba${ativa === ABA_TODOS ? ' ativa' : ''}`}
          onClick={() => onAba(ABA_TODOS)}
        >
          Todos
          <span className="up-aba-n">{total}</span>
        </button>
        {grupos.map((g) => (
          <button
            key={g.key || 'sem-operadora'}
            type="button"
            role="tab"
            aria-selected={ativa === g.key}
            className={`up-aba${ativa === g.key ? ' ativa' : ''}`}
            onClick={() => onAba(g.key)}
            title={`${g.total} ${plural(g.total, 'paciente')} em ${g.nome}`}
            // A cor da marca desce por variável CSS: a aba, o contador e o ponto
            // se pintam sozinhos a partir daqui.
            style={varsOperadora(g.key)}
          >
            {/* Ponto na cor da operadora; com anel, é a escolhida no envio.
                Some na aba "Sem operadora", que não é marca nenhuma e receberia
                o cinza neutro sem significar nada. */}
            {g.key && (
              <i
                className={`up-aba-cor${g.key === chave ? ' escolhida' : ''}`}
                title={g.key === chave ? 'Operadora escolhida no envio' : undefined}
              />
            )}
            {g.nome}
            <span className="up-aba-n">{g.total}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
