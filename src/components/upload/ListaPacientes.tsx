// Quem entrou por um arquivo do censo, para conferência contra o PDF.
//
// Antes eram dois cliques até chegar num nome: abrir o cartão do arquivo e
// depois escolher o chip "internados" ou "com alta". Dois níveis de expansão
// para um cartão que, aberto, existe justamente para mostrar quem veio — e o
// segundo clique ainda escondia metade da resposta, porque só um grupo podia
// ficar aberto por vez.
//
// Agora abrir o arquivo já mostra tudo, com as duas situações separadas por
// cabeçalho. O que era escolha ("qual grupo eu vejo?") virou leitura ("vieram
// estes em leito e estes com alta"), que é a pergunta real de quem confere.
//
// Tabela de colunas fixas, não linhas corridas: conferir um censo é comparar com
// o PDF ao lado, e para isso o olho precisa descer UMA coluna (todas as datas
// alinhadas, todos os atendimentos alinhados) em vez de reencontrar cada campo
// numa posição diferente a cada linha.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nomeProprio } from '../../lib/texto'
import type { PacienteGravado } from '../../types/api'

export const listaPacientesStyles = `
/* Bloco de quem entrou: scroll próprio — um censo pode ter 60 nomes, e sem teto
   a lista empurraria para fora da tela os avisos que vêm abaixo do cartão. */
.up-lista-pac{border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);max-height:320px;overflow:auto}
/* Herda .bmais-table (zebra, hover) e só aperta a densidade: esta é uma lista de
   conferência dentro de um card, não a tabela cheia de uma tela. O nome é a
   única coluna elástica; as demais ficam do tamanho do conteúdo. */
.up-pac-tabela{font-size:var(--t-sm);width:100%}
.up-pac-tabela thead th{padding:6px 8px;background:var(--surface-3)}
.up-pac-tabela tbody td{padding:5px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.up-pac-tabela th:first-child,.up-pac-tabela td:first-child{padding-left:10px}
.up-pac-tabela th:last-child,.up-pac-tabela td:last-child{padding-right:10px}
.up-pac-tabela th.col-data,.up-pac-tabela td.up-pac-data{text-align:right}
.up-pac-nome{max-width:0;width:100%}          /* absorve a sobra; o resto encolhe */
/* Linha com problema: faixa lateral da cor do tipo + fundo levíssimo. A cor é
   reforço — a FRASE embaixo do nome é que diz o que houve, para quem não
   distingue as matizes e para quem lê por leitor de tela. */
.up-pac-com-problema td:first-child{box-shadow:inset 3px 0 0 var(--warning)}
.up-pac-com-problema.convenio_nao_reconhecido td{background:rgba(217,105,12,.05)}
.up-pac-com-problema.outra_operadora td{background:rgba(31,93,170,.05)}
.up-pac-com-problema.outra_operadora td:first-child{box-shadow:inset 3px 0 0 var(--info)}
.up-pac-com-problema.sem_convenio td{background:rgba(217,105,12,.05)}
.up-pac-vazio{color:var(--muted-2);font-style:italic}
.up-pac-atend{font-family:var(--font-mono);font-size:var(--t-xs);color:var(--muted);font-variant-numeric:tabular-nums}
.up-pac-leito{font-size:var(--t-xs);color:var(--muted-2)}
.up-pac-conv{font-size:var(--t-xs);color:var(--muted-2);max-width:180px}
/* Data colorida pela situação — a mesma dupla do resto da tela. */
.up-pac-data{font-size:var(--t-xs);font-weight:600;font-variant-numeric:tabular-nums}
.up-pac-data.internado{color:var(--info)}
.up-pac-data.alta{color:var(--success-2)}

/* Separador de situação: uma linha da própria tabela, sticky, com a cor do
   grupo à esquerda. Como linha (e não um título fora da tabela), as colunas
   continuam alinhadas entre as duas seções — que é o que permite conferir
   descendo a vista por uma coluna só, sem reencontrar o alinhamento no meio. */
.up-pac-sep td{position:sticky;top:26px;z-index:1;padding:5px 10px;background:var(--surface-3);border-top:1px solid var(--border);border-bottom:1px solid var(--border-soft)}
.up-pac-sep:first-child td{border-top:0}
.up-pac-sep-rot{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.up-pac-sep-rot.internado{color:var(--info)}
.up-pac-sep-rot.alta{color:var(--success-2)}
.up-pac-sep-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.up-pac-sep-dot.internado{background:var(--info)}
.up-pac-sep-dot.alta{background:var(--success)}
.up-pac-sep-n{font-family:var(--font-mono);color:var(--muted);font-weight:600;letter-spacing:0}

/* Busca no CABEÇALHO do cartão, ao lado da data do censo. Fechada é só a lupa;
   aberta vira um campo de largura fixa — assim o nome do arquivo e a data, que
   são o que se lê primeiro, não disputam espaço com um campo sempre presente. */
.up-pac-lupa{display:grid;place-items:center;width:24px;height:24px;flex-shrink:0;border:1px solid transparent;background:none;border-radius:50%;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.up-pac-lupa:hover{background:var(--surface-3);border-color:var(--border);color:var(--ink-2)}
.up-pac-lupa:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18)}
.up-pac-busca{display:inline-flex;align-items:center;gap:7px;flex-shrink:0}
/* Abre a LARGURA (não um scaleX): o campo cresce de verdade, empurrando a linha
   aos poucos, em vez de um retângulo esticado que distorceria o ícone e o texto
   de dentro. Sai da largura da lupa (24px) e vai até 200px, então o campo
   "nasce" de onde o botão estava.

   .42s, contra os .16s da primeira versão: a abertura é para ser vista. A curva
   desacelera no fim (não é linear), que é o que faz o movimento parecer que
   está "chegando" em vez de parar de repente. Digitar durante a animação
   funciona — o foco no input é imediato.

   O container NÃO ganha opacity: a borda e o anel de foco do campo precisam
   estar visíveis desde o primeiro quadro, senão clicar na lupa parece não ter
   surtido efeito. O que entra por opacity é só o CONTEÚDO (ícone e texto). */
.up-pac-busca-campo{position:relative;width:200px;animation:up-busca-abre .42s cubic-bezier(.16,.84,.3,1)}
@keyframes up-busca-abre{from{width:24px}to{width:200px}}

/* Conteúdo do campo: espera a largura crescer o bastante para caber, senão o
   ícone e o placeholder apareceriam cortados pela borda. */
.up-pac-busca-campo svg{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--muted-2);pointer-events:none;animation:up-busca-conteudo .42s ease-out}
@keyframes up-busca-conteudo{from{opacity:0}50%{opacity:0}to{opacity:1}}
@keyframes up-busca-texto{from{color:transparent}50%{color:transparent}to{color:var(--ink)}}
/* Quem prefere menos movimento recebe o campo já aberto. */
@media (prefers-reduced-motion:reduce){
  .up-pac-busca-campo,.up-pac-busca-campo svg,.up-pac-input{animation:none}
}

/* Só o TEXTO desbota, não a caixa: a animação mexe na cor do texto, não na
   opacidade da caixa, para a borda e o anel de foco continuarem sólidos
   enquanto o campo abre.
   Regra ÚNICA: separar a animação numa segunda regra fazia esta vencer pela
   ordem e a animação sumia sem erro nenhum. */
.up-pac-input{width:100%;padding:4px 26px 4px 27px;border:1px solid var(--border);border-radius:99px;background:var(--surface);font-family:inherit;font-size:var(--t-sm);color:var(--ink);animation:up-busca-texto .42s ease-out}
.up-pac-input::placeholder{color:inherit;opacity:.55}
.up-pac-input:focus{outline:none;border-color:var(--primary-3);box-shadow:0 0 0 3px rgba(21,92,168,.12)}
.up-pac-limpar{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:18px;height:18px;border:0;background:none;border-radius:50%;color:var(--muted-2);cursor:pointer}
.up-pac-limpar:hover{background:var(--surface-3);color:var(--ink-2)}
.up-pac-achados{font-size:var(--t-xs);color:var(--muted)}
/* Coluna do lápis: largura fixa e sem padding lateral extra — é um alvo de
   clique, não um dado. O botão aparece esmaecido e firma no hover da LINHA
   (não só no dele), para não poluir uma lista de 99 nomes com 99 ícones em
   destaque, mas continuar fácil de achar quando o olho já está na linha. */
/* Coluna de ações: lápis + lixeira lado a lado em toda linha. */
/* Largura suficiente para os DOIS botoes (28px + 2px de borda cada) mais o
   espaco entre eles, com folga. Com 70px a conta fechava exatamente no limite
   e a lixeira, que e o primeiro filho, era a que sumia: numa celula nowrap o
   que nao cabe some da esquerda, sem erro nenhum na tela.
   Flex em vez de inline-block: a caixa passa a ser medida, e nao estimada a
   partir do espaco em branco do JSX entre as tags. */
.up-pac-acao{width:82px;white-space:nowrap;padding-left:0!important;padding-right:6px!important}
/* O flex fica num wrapper DENTRO da celula, nao na celula: display:flex num
   <td>/<th> tira a coluna do algoritmo de largura da tabela e o cabecalho
   desalinha do corpo. O gap explicito tambem tira a medida do espaco em branco
   do JSX, que era o que fazia a conta estourar por alguns pixels. */
.up-pac-acoes{display:flex;align-items:center;justify-content:flex-end;gap:2px}
/* Alerta antes do nome: ocupa lugar fixo, então os nomes continuam alinhados
   entre as linhas COM e SEM problema — um ícone que empurra o texto só de um
   lado quebraria a coluna que se usa para conferir contra o PDF. */
/* O alerta é um BOTÃO com popover, não um ícone mudo. Largura fixa mantém os
   nomes alinhados entre linhas com e sem problema — é o que permite conferir
   descendo a vista por uma coluna só. */
.up-pac-ico-alerta{display:inline-grid;place-items:center;width:18px;height:18px;vertical-align:-4px;margin-right:4px;border:0;background:none;border-radius:50%;padding:0;color:var(--warning-2);cursor:pointer;transition:background .12s}
.up-pac-ico-alerta:hover{background:var(--warning-bg)}
.up-pac-ico-alerta:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(217,105,12,.22)}
.up-pac-com-problema.outra_operadora .up-pac-ico-alerta{color:var(--info)}
.up-pac-com-problema.outra_operadora .up-pac-ico-alerta:hover{background:var(--info-bg)}

/* Popover em POSITION:FIXED, fora do fluxo da tabela — as coordenadas vêm do
   retângulo do botão (ver AlertaDoPaciente).
   Por absolute dentro da célula ele era cortado DUAS vezes: pelo overflow:hidden
   do <td> (que existe para o nome longo truncar) e pelo overflow:auto da lista
   (que existe para 70 nomes não empurrarem a tela). Recorte não se resolve com
   z-index: só saindo do container que corta.
   O texto quebra linha (a tabela inteira é nowrap) e a largura é fixa, casando
   com a LARGURA usada no cálculo da posição. */
.up-pac-pop{position:fixed;z-index:300;display:block;width:260px;padding:8px 10px;background:var(--ink);color:#fff;border-radius:var(--r-sm);box-shadow:var(--shadow-lg);font-size:var(--t-xs);line-height:1.45;white-space:normal;font-weight:400;animation:up-pop-alerta .14s ease-out}
@keyframes up-pop-alerta{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
/* Abrindo para CIMA (sem espaço abaixo): o "top" recebido é a borda superior do
   ícone, então o balão sobe a própria altura. */
/* Regra ÚNICA: separadas, a segunda vencia pela ordem e o transform da primeira
   sumia — o balão nasceria na posição errada, sem erro nenhum. */
.up-pac-pop.acima{transform:translateY(-100%);animation:up-pop-alerta-acima .14s ease-out}
@keyframes up-pop-alerta-acima{from{opacity:0;transform:translateY(calc(-100% + 3px))}to{opacity:1;transform:translateY(-100%)}}
/* Setinha apontando para o ícone: sem ela o balão parece solto na tela. */
.up-pac-pop::before{content:"";position:absolute;bottom:100%;left:9px;border:5px solid transparent;border-bottom-color:var(--ink)}
.up-pac-pop.acima::before{bottom:auto;top:100%;border-bottom-color:transparent;border-top-color:var(--ink)}
@media (prefers-reduced-motion:reduce){.up-pac-pop,.up-pac-pop.acima{animation:none}}
/* Lixeira: mesma caixa do lápis. Em repouso fica CINZA — não pode gritar mais
   que o lápis, que é a ação esperada (corrigir, não apagar).
   O hover só tinge o ícone e o fundo de leve; a versão anterior invertia para
   vermelho sólido com texto branco, e um bloco maciço de cor saltando a cada
   linha que o mouse cruza polui a leitura de uma lista de 70 nomes. */
.up-pac-lixeira{display:inline-grid;place-items:center;width:28px;height:28px;border:1px solid transparent;background:none;border-radius:7px;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.up-pac-tabela tbody tr:hover .up-pac-lixeira{color:var(--muted)}
.up-pac-lixeira:hover{background:var(--danger-bg);border-color:var(--danger-bg-2);color:var(--danger-2)}
.up-pac-lixeira:focus-visible{outline:none;color:var(--danger-2);background:var(--danger-bg);box-shadow:0 0 0 3px rgba(200,36,60,.18)}
/* O lápis é LEGÍVEL em repouso, não um fantasma. A primeira versão usava
   opacity .45 sobre um cinza que já era claro (muted-2): o contraste ficava
   baixo demais para se reconhecer o símbolo — quem não soubesse que havia um
   botão ali não o encontrava.
   Agora a cor é sólida (muted, o mesmo tom dos rótulos da tabela) e o hover da
   linha promove para o azul de ação. Sem opacity: o que muda é a COR, que dá
   para calibrar; opacity sobre cinza claro só apaga. */
.up-pac-lapis{display:inline-grid;place-items:center;width:28px;height:28px;border:1px solid transparent;background:none;border-radius:7px;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.up-pac-tabela tbody tr:hover .up-pac-lapis{color:var(--primary-3);background:var(--primary-soft)}
.up-pac-lapis:hover{background:var(--primary-3);border-color:var(--primary-3);color:#fff}
/* Teclado: quem navega por Tab não passa pelo hover da linha, então o foco
   precisa destacar o botão sozinho. */
.up-pac-lapis:focus-visible{outline:none;color:var(--primary-3);box-shadow:0 0 0 3px rgba(21,92,168,.18)}
/* Sem id para editar: o botão existe (a função continua visível) mas não
   responde. Usa muted-2, não muted-3: precisa ficar ABAIXO dos ativos e ainda
   assim legível como um lápis — é o que diferencia "não dá para editar ESTE" de
   "não existe edição aqui". Com muted-3 o contraste caía para 1,8:1 sobre o
   fundo da tabela, o mesmo borrão que esta mudança veio corrigir. */
.up-pac-lapis:disabled{cursor:default;color:var(--muted-2)}
.up-pac-tabela tbody tr:hover .up-pac-lapis:disabled,
.up-pac-lapis:disabled:hover{background:none;border-color:transparent;color:var(--muted-2)}
.up-pac-nada{padding:14px 10px;text-align:center;font-size:var(--t-sm);color:var(--muted)}
/* Trecho que casou com a busca: fundo âmbar, como qualquer resultado de busca. */
.up-pac-marca{background:var(--caution-bg);color:var(--ink);border-radius:2px;padding:0 1px}
`

const IcoLupa = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
)

const IcoAlerta = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
  </svg>
)

const IcoLixeira = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" /><path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
)

const IcoLapis = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

const IcoX = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

/** Sem acento e em minúsculas: quem procura "jose" tem de achar "JOSÉ". */
function normalizar(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Texto com o trecho que casou destacado.
 *
 *  O índice sai do texto NORMALIZADO e é usado para fatiar o ORIGINAL, então os
 *  dois precisam ter o mesmo comprimento. `normalize('NFD')` decompõe "É" em
 *  dois caracteres, e removê-los devolve o tamanho original — exceto se o texto
 *  JÁ vier decomposto do banco, caso em que o recorte sairia deslocado ("JOSÉ
 *  ANTONIO" destacaria " ANTONI" em vez de "ANTONIO"). Compor para NFC antes
 *  resolve na origem: a partir daí normalizar nunca muda o comprimento. */
function Realce({ texto: cru, termo }: { texto: string; termo: string }) {
  const texto = cru.normalize('NFC')
  if (!termo) return <>{texto}</>
  const i = normalizar(texto).indexOf(normalizar(termo))
  if (i < 0) return <>{texto}</>
  // O comprimento vem do TEXTO (não do termo digitado): os dois casam sem
  // acento, mas o trecho real pode ter acentos que o termo não tem.
  const fim = i + termo.normalize('NFC').length
  return (
    <>
      {texto.slice(0, i)}
      <mark className="up-pac-marca">{texto.slice(i, fim)}</mark>
      {texto.slice(fim)}
    </>
  )
}

function identificacao(p: PacienteGravado): string {
  // Alguns censos não trazem coluna de paciente: o hospital identifica a
  // internação pela senha de autorização (ver migration 0021).
  //
  // A senha entra CRUA, sem o rótulo "senha" na frente: quem diz o que é aquele
  // número é o cabeçalho da coluna (ver `tituloIdentificacao`). Repetir a
  // palavra em toda linha empurrava o número — o dado que se procura e se
  // confere — para a segunda metade da célula, atrás de um rótulo igual em
  // todas elas.
  return nomeProprio(p.nome) || p.senha || ''
}

/** Título da 1ª coluna: "Paciente", ou "Senha" quando é ela que identifica.
 *
 *  O censo que não traz coluna de paciente identifica a internação pela senha de
 *  autorização. Manter "Paciente" sobre uma coluna de números faz a tela afirmar
 *  algo falso; trocar o título é o que explica a coluna sem poluir cada linha.
 *
 *  Só troca quando NENHUM listado tem nome: num lote misto, "Paciente" continua
 *  descrevendo a maioria, e quem vier por senha aparece como o número solto. */
function tituloIdentificacao(pacientes: PacienteGravado[]): string {
  const comNome = pacientes.some((p) => p.nome)
  const comSenha = pacientes.some((p) => !p.nome && p.senha)
  return !comNome && comSenha ? 'Senha' : 'Paciente'
}

/** Ícone de alerta que abre o texto do problema num popover.
 *
 *  Botão, não `title`: o tooltip do navegador demora a aparecer, some ao mover o
 *  mouse e não existe no toque. Aqui o clique é explícito e o conteúdo fica
 *  enquanto se lê. */
function AlertaDoPaciente({ problema }: { problema: { tipo: string; texto: string } }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const botao = useRef<HTMLButtonElement>(null)

  // O balão é `position:fixed`, fora do fluxo da tabela, e a posição vem do
  // retângulo do BOTÃO. Posicionado por `absolute` dentro da célula ele era
  // cortado duas vezes: pelo `overflow:hidden` do <td> (que existe para o nome
  // longo truncar com reticências) e pelo `overflow:auto` da lista (que existe
  // para 70 nomes não empurrarem a tela). Nenhum z-index resolve recorte —
  // sair do container é a única saída.
  function abrir() {
    const r = botao.current?.getBoundingClientRect()
    if (!r) return
    const LARGURA = 260
    const MARGEM = 8
    // Não deixa passar da borda direita da janela: numa tabela larga o ícone
    // pode estar perto do fim da tela.
    const left = Math.min(r.left - 4, window.innerWidth - LARGURA - MARGEM)
    // Sem espaço abaixo, abre ACIMA do ícone — senão o balão nasce fora da
    // janela nas últimas linhas da lista, que é onde ele mais é usado.
    const cabeAbaixo = window.innerHeight - r.bottom > 130
    setPos({
      top: cabeAbaixo ? r.bottom + 6 : r.top - 6,
      left: Math.max(MARGEM, left),
    })
    setAberto(true)
  }

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (!botao.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    // Rolar ou redimensionar move o botão e o balão ficaria "solto" no ar; como
    // ele é fixed, a posição não acompanha — então fecha. `true` para pegar o
    // scroll da PRÓPRIA lista (evento não borbulha).
    const fecha = () => setAberto(false)
    document.addEventListener('mousedown', fora, true)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', fecha, true)
    window.addEventListener('resize', fecha)
    return () => {
      document.removeEventListener('mousedown', fora, true)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', fecha, true)
      window.removeEventListener('resize', fecha)
    }
  }, [aberto])

  const acima = pos != null && aberto
    && pos.top < (botao.current?.getBoundingClientRect().top ?? 0)

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="up-pac-ico-alerta"
        aria-expanded={aberto}
        aria-label={aberto ? 'Fechar o aviso deste paciente' : 'Ver o aviso deste paciente'}
        onClick={() => (aberto ? setAberto(false) : abrir())}
      >
        {IcoAlerta}
      </button>
      {aberto && pos && (
        <span
          className={`up-pac-pop ${problema.tipo}${acima ? ' acima' : ''}`}
          role="status"
          style={{ top: pos.top, left: pos.left }}
        >
          {problema.texto}
        </span>
      )}
    </>
  )
}

function Linhas({ pacientes, termo, onEditar, onRemover }: {
  pacientes: PacienteGravado[]
  termo: string
  onEditar?: (p: PacienteGravado) => void
  /** Apaga o paciente do sistema. Aparece em TODA linha que tenha id. */
  onRemover?: (p: PacienteGravado) => void
}) {
  return (
    <>
      {pacientes.map((p, i) => {
        const id = identificacao(p)
        return (
          <tr key={`${p.atendimento ?? ''}-${i}`}
              className={p.problema ? `up-pac-com-problema ${p.problema.tipo}` : undefined}>
            {/* Nome sempre pelo `nomeProprio`: a gravação já normaliza (o backend
                aplica a mesma regra), mas os censos chegam em CAIXA ALTA e um
                resultado antigo — de cache ou de servidor ainda não atualizado —
                traria o valor cru. Normalizar também na exibição faz a tela
                nunca mostrar "MYRIAN BEATRIZ SILVA PET" ao lado da ficha que
                guarda "Myrian Beatriz Silva Pet". */}
            <td className="up-pac-nome" title={nomeProprio(p.nome) || undefined}>
              {/* Alerta ANTES do nome: é o que faz a linha problemática saltar
                  ao correr a vista pela coluna. Depois do nome ele apareceria a
                  distâncias diferentes em cada linha (os nomes têm tamanhos
                  variados) e deixaria de funcionar como marcador de coluna.
                  O texto do problema fica NELE, sob clique — escrito embaixo do
                  nome, ele dobrava a altura de cada linha marcada e quebrava a
                  varredura da lista, que é o que se faz ao conferir contra o
                  PDF. Aqui o ícone anuncia, e quem quiser o detalhe abre. */}
              {p.problema && <AlertaDoPaciente problema={p.problema} />}
              {p.nome
                ? <Realce texto={nomeProprio(p.nome)} termo={termo} />
                : id
                  ? <i className="up-pac-vazio"><Realce texto={id} termo={termo} /></i>
                  : <i className="up-pac-vazio">sem identificação no PDF</i>}
            </td>
            {/* Célula sem valor fica EM BRANCO nesta lista (decisão do usuário
                em 16/09/2026), ao contrário do resto do sistema, onde o `—`
                segue marcando vazio. Aqui a lista é longa e varrida linha a
                linha contra o PDF: uma coluna de traços repetidos competia com
                os dados que se está conferindo. */}
            <td className="up-pac-atend">
              {p.atendimento ? <Realce texto={p.atendimento} termo={termo} /> : null}
            </td>
            <td className="up-pac-leito">{p.leito_codigo || null}</td>
            <td className="up-pac-conv" title={p.convenio ?? undefined}>
              {p.convenio || null}
            </td>
            {/* A data e a cor saem da situação DA LINHA, não do grupo: lendo de
                `p.situacao`, uma linha fora do grupo mostraria a data certa em
                vez de ler `data_alta` de quem não tem alta. */}
            <td className={`up-pac-data ${p.situacao === 'ALTA' ? 'alta' : 'internado'}`}>
              {(p.situacao === 'ALTA' ? p.data_alta : p.data_entrada) || null}
            </td>
            {/* Lápis por linha.
                Sem `id` o botão aparece DESABILITADO, não ausente: o id vem do
                backend, e um resultado antigo (ou um servidor que ainda não
                recarregou) deixava a célula vazia sem dizer por quê — quem
                esperava editar concluía que a função não existe. Desabilitado
                com o motivo no title, a diferença entre "não dá para editar
                este" e "não existe edição" fica visível. */}
            <td className="up-pac-acao">
              <div className="up-pac-acoes">
                {/* Remover ao lado do lápis, em TODA linha: um registro pode estar
                    errado sem que o sistema saiba (paciente que não é daquele
                    hospital, linha do PDF que não era paciente). Limitar às linhas
                    com problema deixava sem saída justamente o erro que só a
                    pessoa enxerga. O risco do clique errado é coberto pela
                    confirmação e pelo desfazer. */}
                {onRemover && p.id != null && (
                  <button
                    type="button"
                    className="up-pac-lixeira"
                    onClick={() => onRemover(p)}
                    // "deste censo", não "do sistema": quem já existia antes do
                    // envio continua no sistema — o X corrige a lista deste
                    // documento, e só apaga a ficha de quem nasceu dele.
                    title={`Tirar ${nomeProprio(p.nome) || p.atendimento || 'este paciente'} da lista deste censo`}
                    aria-label={`Remover ${nomeProprio(p.nome) || p.atendimento || 'paciente'}`}
                  >
                    {IcoLixeira}
                  </button>
                )}
                {onEditar && (
                  <button
                    type="button"
                    className="up-pac-lapis"
                    disabled={p.id == null}
                    onClick={() => p.id != null && onEditar(p)}
                    title={p.id == null
                      ? 'Este envio foi processado antes da edição por linha. Reenvie o censo para poder editar aqui.'
                      : `Editar ${nomeProprio(p.nome) || p.atendimento || 'este paciente'}`}
                    aria-label={`Editar ${nomeProprio(p.nome) || p.atendimento || 'paciente'}`}
                  >
                    {IcoLapis}
                  </button>
                )}
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

function Separador({ deAlta, n, total }: { deAlta: boolean; n: number; total: number }) {
  const cor = deAlta ? 'alta' : 'internado'
  return (
    <tr className="up-pac-sep">
      <td colSpan={6}>
        <span className={`up-pac-sep-rot ${cor}`}>
          <span className={`up-pac-sep-dot ${cor}`} />
          {deAlta ? 'Alta' : 'Internações'}
          <span className="up-pac-sep-n">
            {/* Com busca ativa, mostra "achados de total" — senão o número
                mudaria ao digitar e pareceria que o censo encolheu. */}
            {n === total ? n : `${n} de ${total}`}
          </span>
        </span>
      </td>
    </tr>
  )
}

/** Campo de busca da lista de um arquivo.
 *
 *  Fica no CABEÇALHO do cartão, junto do nome do PDF e da data — não acima da
 *  tabela. Quem procura um nome quer dizer "neste arquivo, ache fulano", e o
 *  cabeçalho é onde o arquivo é identificado; ali o campo também não é empurrado
 *  para fora da vista quando a lista rola.
 *
 *  O estado mora no cartão, não aqui: o campo e a tabela ficam em partes
 *  diferentes da árvore, e o termo precisa alcançar as duas. */
export function BuscaPacientes({ termo, onTermo, achados, total }: {
  termo: string
  onTermo: (v: string) => void
  /** Quantos casaram; junto de `total` vira "3 de 48" enquanto se digita. */
  achados: number
  total: number
}) {
  // Fechada, a busca é só uma lupa. Um campo de texto sempre aberto no cabeçalho
  // competiria com o nome do arquivo e a data — que é o que se lê primeiro —
  // para um recurso que só entra em cena quando a lista é longa. A lupa ocupa
  // 24px, diz o que faz e sai da frente.
  const [aberta, setAberta] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const buscando = Boolean(termo.trim())

  // Abrir e já poder digitar: quem clica na lupa quer escrever, não clicar duas
  // vezes. `useEffect` e não foco no onClick porque o input só existe no DOM
  // depois que `aberta` vira true.
  useEffect(() => {
    if (aberta) inputRef.current?.focus()
  }, [aberta])

  function fechar() {
    // Fechar limpa o termo: uma busca ativa escondida atrás de uma lupa deixaria
    // a lista filtrada sem nada na tela explicando por quê.
    onTermo('')
    setAberta(false)
  }

  if (!total) return null

  if (!aberta) {
    return (
      <button
        type="button"
        className="up-pac-lupa"
        onClick={(e) => { e.stopPropagation(); setAberta(true) }}
        title={`Procurar entre os ${total} pacientes deste arquivo`}
        aria-label="Procurar paciente neste arquivo"
        aria-expanded={false}
      >
        {IcoLupa}
      </button>
    )
  }

  return (
    <span className="up-pac-busca">
      <span className="up-pac-busca-campo">
        {IcoLupa}
        <input
          ref={inputRef}
          type="text"
          className="up-pac-input"
          placeholder="Procurar paciente…"
          value={termo}
          onChange={(e) => onTermo(e.target.value)}
          aria-label="Procurar paciente neste arquivo"
          onClick={(e) => e.stopPropagation()}
          // Esc fecha, como em qualquer campo de busca. Enter não submete nada:
          // a filtragem é ao vivo, e o cartão pode estar dentro de um <form>.
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.stopPropagation(); fechar() }
            if (e.key === 'Enter') e.preventDefault()
          }}
        />
        <button type="button" className="up-pac-limpar"
                onClick={(e) => { e.stopPropagation(); fechar() }}
                aria-label={buscando ? 'Limpar busca' : 'Fechar busca'}>
          {IcoX}
        </button>
      </span>
      {buscando && (
        <span className="up-pac-achados" role="status">
          {achados} de {total}
        </span>
      )}
    </span>
  )
}

/** Filtra por nome, senha ou atendimento — sem acento e sem caixa. */
export function filtrarPacientes(lista: PacienteGravado[], termo: string): PacienteGravado[] {
  const alvo = normalizar(termo.trim())
  if (!alvo) return lista
  return lista.filter((p) => normalizar(identificacao(p)).includes(alvo)
    || normalizar(p.atendimento ?? '').includes(alvo))
}

/** Tem alerta na linha? `resolvido` sai da conta: quem foi corrigido na modal
 *  deixou de ser um problema, e mantê-lo no filtro faria a lista nunca esvaziar. */
export function temProblema(p: PacienteGravado): boolean {
  return Boolean(p.problema) && !p.resolvido
}

export function contarProblemas(...listas: PacienteGravado[][]): number {
  return listas.reduce((n, l) => n + l.filter(temProblema).length, 0)
}

export function ListaPacientes({
  emLeito, comAlta, termo = '', somenteProblema = false, onEditar, onRemover,
}: {
  emLeito: PacienteGravado[]
  comAlta: PacienteGravado[]
  /** Termo vindo do campo no cabeçalho do cartão. */
  termo?: string
  /** Mostra só as linhas com alerta. O aviso do painel ("2 pacientes são de
   *  Mediservice… estão marcados na lista abaixo") diz QUE eles estão marcados;
   *  num censo de 60 nomes, achá-los ainda era rolar e caçar a faixa colorida.
   *  Ligado, a lista vira exatamente a relação de quem precisa de decisão. */
  somenteProblema?: boolean
  /** Abre a edição de um paciente. Ausente = lista somente leitura. */
  onEditar?: (p: PacienteGravado) => void
  /** Apaga o paciente do sistema. Ausente = lista sem exclusão. */
  onRemover?: (p: PacienteGravado) => void
}) {
  const total = emLeito.length + comAlta.length

  // Os dois filtros se somam: buscar por nome DENTRO dos que têm problema é o
  // caminho de quem já sabe o nome que veio no aviso.
  const recortar = useCallback((lista: PacienteGravado[]) => {
    const base = somenteProblema ? lista.filter(temProblema) : lista
    return filtrarPacientes(base, termo)
  }, [somenteProblema, termo])
  const leitoVisivel = useMemo(() => recortar(emLeito), [emLeito, recortar])
  const altaVisivel = useMemo(() => recortar(comAlta), [comAlta, recortar])
  const achados = leitoVisivel.length + altaVisivel.length

  if (!total) return null

  return (
    <div>
      <div className="up-lista-pac">
        {achados === 0 ? (
          <div className="up-pac-nada">
            {termo.trim()
              ? `Nenhum paciente com “${termo.trim()}”${somenteProblema ? ' entre os marcados' : ''}.`
              // Sem termo e sem resultado só acontece com o filtro ligado — e é
              // uma boa notícia, não um vazio: todo mundo foi resolvido.
              : 'Nenhum paciente marcado: todos os alertas foram resolvidos.'}
          </div>
        ) : (
          <table className="bmais-table up-pac-tabela">
            <thead>
              <tr>
                <th>{tituloIdentificacao([...emLeito, ...comAlta])}</th>
                <th>Atendimento</th>
                <th>Leito</th>
                <th>Convênio</th>
                {/* Cabeçalho neutro: a coluna traz entrada de quem está em leito
                    e alta de quem saiu, e cada seção tem o seu separador. */}
                <th className="col-data">Data</th>
                <th className="up-pac-acao"><span className="sr-only">Editar</span></th>
              </tr>
            </thead>
            <tbody>
              {/* Em leito primeiro: é o estado corrente do hospital. As seções só
                  aparecem quando têm linha — com a busca ativa, um grupo pode
                  ficar vazio, e um cabeçalho sem nada embaixo confunde. */}
              {leitoVisivel.length > 0 && (
                <>
                  <Separador deAlta={false} n={leitoVisivel.length} total={emLeito.length} />
                  <Linhas pacientes={leitoVisivel} termo={termo.trim()} onEditar={onEditar}
                          onRemover={onRemover} />
                </>
              )}
              {altaVisivel.length > 0 && (
                <>
                  <Separador deAlta n={altaVisivel.length} total={comAlta.length} />
                  <Linhas pacientes={altaVisivel} termo={termo.trim()} onEditar={onEditar}
                          onRemover={onRemover} />
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
