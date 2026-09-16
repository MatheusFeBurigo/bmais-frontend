// Um arquivo do envio, no resultado do processamento.
//
// Cinco estados mutuamente exclusivos, cada um com uma SAÍDA diferente — e é a
// saída, não a gravidade, que define a forma do cartão:
//
//   digitalizado     → nenhuma correção aqui resolve; cadastrar à mão (bloco próprio)
//   erro de leitura  → o layout não foi reconhecido; avisar o suporte
//   já lido antes    → decisão do usuário: reenviar ou pular
//   falta o hospital → o assistente pergunta e reprocessa
//   lido             → conferência: contagens, nomes e os avisos do leitor
//
// O cartão "lido" nasce RECOLHIDO quando não tem nada a resolver: num lote de dez
// arquivos, nove perfeitos, o usuário não deveria rolar nove cartões cheios para
// achar o único que pede decisão. Recolhido ele ainda mostra o que importa para
// bater o olho — nome, hospital, contagem e data —, e abre com um clique.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { classificarAvisos } from '../../lib/avisosCenso'
import type { Operadora, PacienteGravado, UploadCensoResult } from '../../types/api'
import { Alerta } from './Alerta'
import { ContadorAvisos } from './ContadorAvisos'
import { EditarPacienteModal } from './EditarPacienteModal'
import { ConfirmarModal } from '../ConfirmarModal'
import { AvisoDesfazer } from './AvisoDesfazer'
import { nomeProprio } from '../../lib/texto'
import { removerPacienteDoCenso, restaurarInternacao } from '../../services/internacao.service'
import {
  BuscaPacientes, contarProblemas, filtrarPacientes, ListaPacientes,
} from './ListaPacientes'
import { DataDoCenso, IcoChevron, IcoImagem, plural } from './comuns'

export const cartaoArquivoStyles = `
/* Um arquivo do envio. */
.up-arquivo{padding:11px 14px;border-top:1px solid var(--border-soft);border-left:3px solid transparent;display:grid;gap:7px}
/* Painel dos detalhes: separa os alertas da lista de pacientes. Sem isto, o
   último alerta encostava na borda da tabela e os dois se liam como um bloco só. */
.up-painel{display:grid;gap:10px}
.up-arquivo.ok{border-left-color:var(--success)}
.up-arquivo.atencao{border-left-color:var(--warning)}
.up-arquivo.erro{border-left-color:var(--danger)}
.up-arquivo-topo{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
/* Hierarquia da linha: o que o sistema EXTRAIU pesa mais que o nome do arquivo.
   O nome é só a etiqueta de onde o dado veio — quem confere um censo quer saber
   de que hospital é e quantos pacientes entraram, não ler "CENSO - Alta 31 08 a
   02 09 - BRADESCO O.pdf" em negrito escuro atravessando a linha. Mono e
   truncado ele continua, porque é identificador e se compara entre linhas; o que
   cai é o PESO (600→400) e o contraste (--ink→--muted). */
.up-arquivo-nome{font-family:var(--font-mono);font-size:var(--t-sm);font-weight:400;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
/* Hospital: o dado extraído mais importante do cabeçalho — é o que diz a que
   casa aquele censo pertence, e o erro mais caro do envio é acertar o arquivo e
   errar o hospital. Ganha a cor mais escura e o peso que o nome perdeu. */
.up-arquivo-sub{font-size:var(--t-sm);color:var(--muted)}
/* Data do censo: etiqueta discreta, à direita do cabeçalho do arquivo. Fonte
   mono porque é número que se compara entre linhas — alinhado, lê-se de relance
   qual arquivo é de outro dia. */
.up-data-censo{flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border:1px solid var(--border);border-radius:99px;background:var(--surface-3);font-size:var(--t-xs);color:var(--ink-3)}
.up-data-censo svg{color:var(--muted-2)}
/* "Censo de" em texto normal e a DATA em mono/negrito: o rótulo explica, o
   número é o que se compara entre linhas (e alinhado, lê-se de relance qual
   arquivo é de outro dia). */
.up-data-censo-rot{color:var(--muted);font-weight:400}
.up-data-censo b{font-family:var(--font-mono);font-weight:700;color:var(--ink-2)}
.up-arquivo-erro{font-size:var(--t-sm);color:var(--danger-2);line-height:1.45}
/* Container das notas recolhidas. Sem gap: o espaçamento entre alertas vem do
   próprio .al + .al, e dois mecanismos somariam distâncias diferentes. */
.up-arquivo-notas{display:grid}
/* Nomes/convênios de exemplo dentro de um alerta: linha própria e um tom abaixo
   — são a evidência do que a frase acima afirma, não a afirmação. */
.up-exemplos{display:block;margin-top:2px;font-size:var(--t-xs);color:var(--ink-3)}
/* "ver só eles": um link dentro da frase do alerta, não um botão — a ação
   continua a leitura ("estão marcados na lista abaixo (ver só eles)") em vez de
   competir com ela. Herda a cor e o tamanho do alerta em que está. */
.up-link-filtro{padding:0;border:0;background:none;font:inherit;color:inherit;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.up-link-filtro:hover{opacity:.75}
.up-link-filtro:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18);border-radius:3px}
/* Filtro "ver N marcados", ao lado da lupa. Fica âmbar quando ativo: a lista
   embaixo está recortada, e nada mais na tela diria isso. */
.up-so-problema{flex-shrink:0;padding:3px 9px;border:1px solid var(--border);border-radius:99px;background:var(--surface);font-family:inherit;font-size:var(--t-xs);font-weight:600;color:var(--ink-3);cursor:pointer;transition:background .12s,color .12s,border-color .12s}
.up-so-problema:hover{background:var(--surface-3);color:var(--ink-2)}
.up-so-problema:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18)}
.up-so-problema.ativo{border-color:var(--warning);background:rgba(217,105,12,.10);color:var(--warning)}
/* Desfazer POR ARQUIVO: discreto (não é a ação esperada), mas presente no fim da
   conferência daquele arquivo. Borda tracejada e texto neutro — só o hover
   assume o vermelho, porque a leitura padrão da linha é informativa. */
.up-arquivo-desfazer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:8px;border-top:1px dashed var(--border);font-size:var(--t-xs);color:var(--muted)}
.up-arquivo-desfazer span{flex:1;min-width:180px}
.up-arquivo-desfazer b{color:var(--ink-2)}
.up-desfazer-arq{flex-shrink:0;padding:4px 11px;border:1px solid var(--border);background:var(--surface);border-radius:99px;font-family:inherit;font-size:var(--t-xs);font-weight:600;color:var(--muted);cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.up-desfazer-arq:hover:not(:disabled){background:var(--danger-bg);border-color:var(--danger);color:var(--danger-2)}
.up-desfazer-arq:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(200,36,60,.18)}
.up-desfazer-arq:disabled{opacity:.6;cursor:default}
.up-ignorar{margin-left:auto;flex-shrink:0;padding:2px 9px;border:1px solid var(--border);background:var(--surface);border-radius:99px;font-size:var(--t-xs);font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit}
.up-ignorar:hover{border-color:var(--border-strong);color:var(--ink-2)}
/* Ações de um arquivo que pede decisão (hoje: reenvio de um censo já lido). O
   "Pular" perde o margin-left:auto porque aqui as duas ações andam juntas, à
   esquerda — empurrar uma para a borda faria parecer que não se relacionam. */
.up-arquivo-acoes{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.up-arquivo-acoes .up-ignorar{margin-left:0}

/* Arquivo digitalizado: o aviso vira BLOCO, não uma linha de erro. Este caso não
   se resolve reenviando — os pacientes têm de ser cadastrados à mão —, e a
   instrução precisa competir em peso com o resto da tela, senão passa batida. */
.up-imagem-aviso{display:flex;gap:11px;padding:11px 12px;border:1px solid var(--warning);border-radius:var(--r-md);background:var(--warning-bg)}
.up-imagem-ico{flex-shrink:0;color:var(--warning-2);margin-top:1px}
.up-imagem-txt{flex:1;min-width:0;font-size:var(--t-sm);color:var(--ink-2);line-height:1.5}
.up-imagem-passos{margin-top:7px;display:grid;gap:4px;font-size:var(--t-sm);color:var(--ink-2)}
.up-ir-cadastrar{flex-shrink:0;padding:4px 12px;border-radius:99px;border:1px solid var(--warning);background:var(--warning);color:#fff;font-size:var(--t-xs);font-weight:600;text-decoration:none}
.up-ir-cadastrar:hover{filter:brightness(.94)}

/* Cabeçalho do arquivo lido: clicável quando o cartão pode recolher. Botão, não
   div — quem navega por teclado precisa alcançar e acionar o mesmo controle. */
/* O botão ocupa a linha mas cede espaço à busca quando ela existe (flex:1 com
   min-width:0, para o nome longo do arquivo truncar em vez de empurrar). */
.up-arquivo-head{display:flex;align-items:center;gap:9px;flex:1;min-width:200px;border:0;background:none;padding:0;font-family:inherit;text-align:left;cursor:pointer}
/* Grupo da direita: busca + data do censo, nesta ordem. O margin-left:auto mora
   aqui (e nao na data) para o bloco inteiro encostar na borda. */
.up-arquivo-fim{margin-left:auto;display:inline-flex;align-items:center;gap:8px;flex-shrink:0}
.up-arquivo-head:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18);border-radius:var(--r-xs)}
/* Resumo do cartão recolhido: as contagens em texto, sem os chips clicáveis —
   recolhido não há o que abrir, e um chip inerte mentiria sobre isso. */
/* Contagem do cartão recolhido: é a resposta ("o que veio neste arquivo?"), não
   um rótulo de apoio. Cor por situação, a mesma do resto da tela — azul para
   internação, verde para alta —, para a linha recolhida já dizer a composição
   do censo sem precisar abrir. */
.up-arquivo-resumo{font-size:var(--t-sm);color:var(--ink-3)}
.up-arquivo-resumo .n-int{color:var(--info);font-weight:600}
.up-arquivo-resumo .n-alta{color:var(--success-2);font-weight:600}
/* Botão "Detalhes": rótulo escrito + chevron. O texto é o que faz o controle se
   explicar sozinho — uma seta solta deixa o usuário adivinhar se aquilo abre
   algo, e num cartão já resumido ("4 internações, 3 altas") nada indicava que os
   nomes estavam por trás. Muda para "Ocultar" quando aberto: o rótulo diz o que
   o clique FAZ agora, não o estado em que se está. */
.up-detalhes{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;padding:3px 9px 3px 11px;border:1px solid var(--border);background:var(--surface);border-radius:99px;font-family:inherit;font-size:var(--t-xs);font-weight:600;color:var(--ink-3);cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.up-detalhes:hover{background:var(--surface-3);border-color:var(--border-strong);color:var(--ink)}
.up-detalhes:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(21,92,168,.18)}
.up-detalhes.aberto{background:var(--primary-soft);border-color:var(--primary-3);color:var(--primary-3)}
.up-arquivo-seta{display:grid;place-items:center;color:currentColor;transition:transform .18s cubic-bezier(.2,.7,.2,1)}
.up-detalhes.aberto .up-arquivo-seta{transform:rotate(180deg)}

/* Contagem por situação de um arquivo SEM nomes (processado antes de a lista
   nominal existir). Rótulo, não controle: não há o que abrir, e a borda
   tracejada diz isso. Cor por SITUAÇÃO, não por importância — internado (azul)
   e alta (verde) são dois estados normais do censo; vermelho/laranja nesta tela
   já significam erro e pendência. O rótulo escrito carrega o sentido para quem
   não distingue as matizes. */
.up-grupos{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.up-grupo-mudo{display:inline-flex;align-items:center;gap:6px;padding:3px 11px;border:1px dashed;border-radius:99px;font-size:var(--t-sm)}
.up-grupo-mudo.internado{border-color:var(--info);color:var(--info)}
.up-grupo-mudo.alta{border-color:var(--success);color:var(--success-2)}

/* Notas do leitor recolhidas: existem, não gritam. Um <summary> em vez de um
   botão porque o conteúdo é texto estático — o navegador já dá o comportamento
   e o estado de expansão para o leitor de tela. */
.up-notas-det summary{cursor:pointer;font-size:var(--t-xs);color:var(--muted);list-style:none;display:inline-flex;align-items:center;gap:5px;padding:2px 0}
.up-notas-det summary::-webkit-details-marker{display:none}
.up-notas-det summary:hover{color:var(--ink-3)}
.up-notas-det[open] summary{margin-bottom:3px}
.up-notas-det .up-notas-seta{display:grid;place-items:center;transition:transform .18s}
.up-notas-det[open] .up-notas-seta{transform:rotate(180deg)}
`

/** Quanto este arquivo pede de quem enviou. Ordena a lista do resultado e decide
 *  se o cartão nasce aberto: o que exige decisão vem primeiro e já aberto; o que
 *  só precisa de conferência vem depois, recolhido. */
export type Urgencia = 'decisao' | 'revisar' | 'ok'

export function urgenciaDe(res: UploadCensoResult): Urgencia {
  // Pede uma ação explícita do usuário nesta tela.
  if (res.erro || res.precisa_hospital) return 'decisao'
  if (res.pendentes) return 'decisao'
  // Entrou, mas o leitor tem algo a dizer que não é mera confirmação.
  //
  // Só `critico` conta aqui. `atencao` é o destino também dos avisos que NENHUM
  // padrão reconheceu (ver avisosCenso.ts), e é um canal aberto: qualquer frase
  // nova que um leitor passe a emitir cairia nele. Se `atencao` mandasse no
  // colapso, bastaria alguém acrescentar um aviso no backend para todos os
  // arquivos que o carregam pararem de recolher — o oposto do que esta tela
  // quer. O aviso de atenção continua visível no cartão de qualquer forma;
  // o que ele não faz é comandar a ordem e a expansão do lote.
  const avisos = classificarAvisos(res.avisos ?? [])
  if (avisos.some((a) => a.nivel === 'critico')) return 'revisar'
  // Censo misto ou enviado no lugar errado: parte dos pacientes entrou sob outra
  // operadora. É exatamente o que a dupla checagem existe para mostrar, então o
  // cartão não pode nascer recolhido escondendo-a. O mesmo vale para o convênio
  // que o cadastro não reconhece.
  if ((res.operadoras_divergentes ?? []).length) return 'revisar'
  if ((res.convenios_nao_reconhecidos ?? []).length) return 'revisar'
  // Idem para quem entrou sem convênio nenhum: é o dado que define as regras de
  // prazo do paciente, e o cartão recolhido esconderia o aviso que o diz.
  if ((res.sem_convenio ?? []).length) return 'revisar'
  // `mantidos_com_alta` NÃO entra: é o censo repetindo quem já saiu — a própria
  // tela o anuncia como nota, e um arquivo cuja única observação é uma nota está
  // limpo. Contá-lo aqui pintava o cartão de laranja, o travava aberto e o punha
  // à frente dos demais para dizer algo que ele mesmo classifica como não-alarme.
  return 'ok'
}

const PESO: Record<Urgencia, number> = { decisao: 0, revisar: 1, ok: 2 }

/** Arquivos que pedem decisão primeiro, depois os que pedem conferência, por fim
 *  os limpos. Estável dentro de cada faixa: a ordem de envio se mantém. */
export function ordenarPorUrgencia(resultados: UploadCensoResult[]): UploadCensoResult[] {
  return [...resultados].sort((a, b) => PESO[urgenciaDe(a)] - PESO[urgenciaDe(b)])
}

export function CartaoArquivo({ res, onIgnorar, somenteLeitura, podeExcluir, operadoras,
                               onDesfazer, desfazendo, onConveniosResolvidos,
                               onDivergentesMudaram }: {
  res: UploadCensoResult
  onIgnorar: (arquivo: string) => void
  /** Quantos pacientes deste arquivo AINDA estão em outra operadora, já
   *  descontando quem foi corrigido ou removido aqui dentro.
   *
   *  Mesmo motivo de `onConveniosResolvidos`: o placar do lote é somado FORA do
   *  cartão, a partir do resultado do processamento, e não enxerga as correções
   *  feitas aqui. Sem isto o badge do topo seguia dizendo "1 arquivo com outra
   *  operadora" depois de o último paciente divergente ter sido acertado. */
  onDivergentesMudaram?: (arquivo: string, aindaAbertos: number) => void
  /** Quantos convênios não reconhecidos deste arquivo o usuário já corrigiu.
   *  O placar do lote é somado FORA do cartão, a partir do resultado do
   *  processamento, e não enxerga as correções feitas aqui dentro — sem isto o
   *  badge do topo continuava dizendo "1 convênio não reconhecido" depois de o
   *  convênio ter sido corrigido. */
  onConveniosResolvidos?: (arquivo: string, quantos: number) => void
  /** Perfil de observação: a lista fica sem o lápis de editar. */
  somenteLeitura?: boolean
  /** Só ADMIN apaga paciente (a rota exige). Sem isto a lixeira apareceria para
   *  o gestor, que pode editar mas receberia 403 ao clicar — um botão que dá
   *  erro é pior que um botão ausente. */
  podeExcluir?: boolean
  /** Cadastro de operadoras, para a modal deixar escolher a certa. */
  operadoras?: Operadora[]
  /** Desfaz SÓ este arquivo. Ausente quando ele não criou nenhum paciente. */
  onDesfazer?: (arquivo: string) => void
  desfazendo?: boolean
}) {
  // Termo da busca da lista deste arquivo. Mora aqui porque o campo fica no
  // CABEÇALHO e a tabela é irmã dele — o termo precisa alcançar os dois.
  const [termoBusca, setTermoBusca] = useState('')
  // Lista recortada só em quem tem alerta. Os avisos do painel dizem "estão
  // marcados na lista abaixo"; este é o botão que cumpre a frase, em vez de
  // deixar o usuário rolar 60 linhas atrás das faixas coloridas.
  const [somenteProblema, setSomenteProblema] = useState(false)
  // Paciente aberto para edição (null = modal fechada).
  const [editando, setEditando] = useState<PacienteGravado | null>(null)
  // Paciente aguardando confirmação de exclusão, e o que já foi apagado (some
  // da lista sem refazer o envio).
  const [removendo, setRemovendo] = useState<PacienteGravado | null>(null)
  const [apagando, setApagando] = useState(false)
  const [removidos, setRemovidos] = useState<number[]>([])
  const [erroRemover, setErroRemover] = useState<string | null>(null)
  // Paciente apagado há pouco, com a ficha para recriar. É o que sustenta o
  // aviso de desfazer no topo da tela.
  const [apagado, setApagado] = useState<
    { paciente: PacienteGravado; ficha: Record<string, unknown> } | null>(null)
  const [desfazendoRemocao, setDesfazendoRemocao] = useState(false)
  // Paciente que saiu da lista SEM ser apagado. Precisa de retorno próprio: não
  // há desfazer a oferecer (a ficha continua lá), mas sumir da lista sem dizer
  // nada deixaria a dúvida de sempre — "apaguei o paciente?".
  const [saiuDaLista, setSaiuDaLista] = useState<string | null>(null)
  // Último número de divergentes já comunicado ao placar do lote. Evita repetir
  // o aviso a cada renderização: o valor é derivado e se recalcula sempre, mas
  // só INTERESSA ao pai quando muda.
  const divergentesAvisados = useRef<number | null>(null)
  // O valor a comunicar, preenchido mais abaixo (é derivado e só existe depois
  // dos returns antecipados). O efeito que o entrega fica AQUI, antes deles:
  // declarado lá embaixo seria um hook condicional.
  const divergentesAtuais = useRef<number | null>(null)
  // Correções feitas nesta tela, por id da internação. O resultado do envio é
  // imutável (veio do backend), então a linha lê daqui quando há uma edição —
  // sem isto o usuário salvaria e continuaria vendo o valor antigo até recarregar.
  const [editados, setEditados] = useState<Record<number, PacienteGravado>>({})

  async function desfazerRemocao() {
    if (!apagado) return
    setDesfazendoRemocao(true)
    try {
      // Rota PRÓPRIA de restauração, não a de criação manual: aquela exige nome
      // e data de entrada, e há censos sem coluna de paciente (identificados
      // pela senha) e sem data — o desfazer falharia justamente neles.
      // O registro ganha id NOVO; a linha volta à lista porque tiramos o id
      // antigo de `removidos`.
      await restaurarInternacao(apagado.ficha)
      if (apagado.paciente.id != null) {
        const idAntigo = apagado.paciente.id
        setRemovidos((lista) => lista.filter((x) => x !== idAntigo))
      }
      setApagado(null)
    } catch (e) {
      // Falhou recriar: o aviso vira um erro que NÃO some sozinho, senão o
      // usuário acha que desfez e o paciente continua apagado.
      setErroRemover((e as Error).message || 'Não foi possível desfazer.')
      setApagado(null)
    } finally {
      setDesfazendoRemocao(false)
    }
  }

  async function confirmarRemocao() {
    if (!removendo?.id) return
    // Sem `censo_id` não há como remover DESTE censo, e um `as number` só engana
    // o compilador: a URL viraria `/censo/undefined/paciente/123`. A frase diz o
    // que fazer, não o motivo técnico.
    if (res.censo_id == null) {
      setErroRemover('Não foi possível remover. Reenvie o arquivo e tente de novo.')
      return
    }
    setApagando(true)
    try {
      const r = await removerPacienteDoCenso(res.censo_id, removendo.id)
      setRemovidos((lista) => [...lista, removendo.id as number])
      // Só oferece DESFAZER quando a ficha de fato saiu do sistema: é o único
      // caso em que há o que recriar. Tendo apenas saído da lista deste censo, o
      // paciente continua lá inteiro, e um "desfazer" ali recriaria um duplicado.
      if (r.apagado && r.ficha) {
        setApagado({ paciente: removendo, ficha: r.ficha as Record<string, unknown> })
      } else {
        setSaiuDaLista(nomeProprio(removendo.nome) || removendo.atendimento || 'Paciente')
      }
      setRemovendo(null)
    } catch (e) {
      // O erro fica na própria modal: fechá-la levaria a mensagem junto e o
      // usuário ficaria sem saber se apagou ou não.
      setErroRemover((e as Error).message || 'Não foi possível remover.')
    } finally {
      setApagando(false)
    }
  }
  // TODO cartão nasce RECOLHIDO, inclusive os que têm aviso.
  //
  // Abrir sozinho o que tinha problema parecia ajudar, mas num lote em que
  // vários arquivos têm aviso a tela abria com todas as listas escancaradas —
  // centenas de linhas entre o usuário e a informação que ele procurava. O que
  // precisa ser visto de imediato (os avisos) está FORA do painel e aparece de
  // qualquer forma; o que o painel guarda é a lista de nomes, que é volume.
  //
  // `escolhaDoUsuario` guarda só o clique explícito (null = nunca clicou), em
  // vez de `useState(false)`: mantém o estado sob controle do usuário mesmo
  // quando o resultado do arquivo é substituído em tela (reprocessamento pelo
  // assistente), sem o cartão se reabrir por conta própria.
  const urgencia = urgenciaDe(res)
  const [escolhaDoUsuario, setEscolhaDoUsuario] = useState<boolean | null>(null)
  const expandido = escolhaDoUsuario ?? false

  // Avisa o placar do lote quando o número de pacientes em outra operadora muda
  // (alguém corrigiu a operadora na modal, ou removeu o paciente da lista).
  //
  // Sem dependência de valor: roda a cada renderização e o próprio `ref` decide
  // se há o que dizer. É de propósito — o número é derivado de três estados
  // diferentes (edições, remoções, desfazer remoção), e listá-los aqui seria
  // repetir a derivação e errar quando ela mudasse.
  useEffect(() => {
    const atual = divergentesAtuais.current
    if (atual === null || atual === divergentesAvisados.current) return
    divergentesAvisados.current = atual
    onDivergentesMudaram?.(res.arquivo, atual)
  })

  // Arquivo DIGITALIZADO (foto/scan): não há texto para ler, e nenhuma correção
  // no sistema muda isso. O que o usuário precisa saber tem duas partes, e por
  // isso este caso ganha cartão próprio em vez de uma linha de erro: (a) os
  // pacientes DESTE censo só entram à mão, e (b) para os próximos envios, o
  // hospital precisa mandar o PDF gerado pelo sistema.
  if (res.erro && res.erro_tipo === 'imagem') {
    return (
      <div className="up-arquivo atencao">
        <div className="up-arquivo-topo">
          <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
          <span className="badge warning"><i className="bdot" />imagem digitalizada</span>
          <DataDoCenso iso={res.data_censo} />
        </div>
        <div className="up-imagem-aviso">
          <span className="up-imagem-ico" aria-hidden>{IcoImagem}</span>
          <div className="up-imagem-txt">
            <b>Este censo precisa ser cadastrado à mão.</b> O arquivo é uma página
            digitalizada (foto ou scan), então não há texto para o sistema ler:
            nenhum paciente foi gravado.
            <div className="up-imagem-passos">
              <div>
                <b>Agora:</b> cadastre os pacientes deste censo pela Visão Geral,
                em <b>“Adicionar paciente”</b>.
              </div>
              <div>
                <b>Para os próximos:</b> peça ao hospital o arquivo gerado pelo
                sistema dele (PDF de texto). Aí a leitura volta a ser automática.
              </div>
            </div>
          </div>
        </div>
        <div className="up-arquivo-acoes">
          <Link to="/" className="up-ir-cadastrar">Ir para a Visão Geral</Link>
          <button type="button" className="up-ignorar" onClick={() => onIgnorar(res.arquivo)}
                  title="Tira este arquivo da lista. Nada foi gravado por ele.">
            Ignorar
          </button>
        </div>
      </div>
    )
  }

  if (res.erro) {
    return (
      <div className="up-arquivo erro">
        <div className="up-arquivo-topo">
          <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
          <span className="badge danger"><i className="bdot" />não lido</span>
          <button type="button" className="up-ignorar" onClick={() => onIgnorar(res.arquivo)}
                  title="Tira este arquivo da lista. Nada foi gravado por ele.">
            Ignorar
          </button>
        </div>
        <div className="up-arquivo-erro">{res.erro}</div>
      </div>
    )
  }

  if (res.precisa_hospital) {
    const lidos = res.pacientes_extraidos ?? 0
    return (
      <div className="up-arquivo atencao">
        <div className="up-arquivo-topo">
          <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
          <span className="badge warning"><i className="bdot" />falta o hospital</span>
          <DataDoCenso iso={res.data_censo} />
        </div>
        <div className="up-arquivo-sub">
          {res.hospital_sugerido
            ? <>O PDF diz <b>“{res.hospital_sugerido}”</b>, que não está no cadastro.</>
            : <>O PDF não traz o nome do hospital.</>}
          {' '}{lidos} {plural(lidos, 'paciente')} {plural(lidos, 'lido')}, nenhum gravado.
        </div>
      </div>
    )
  }

  const gravados = res.gravados_detalhe ?? []
  const emLeito = gravados.filter((p) => p.situacao !== 'ALTA')
  const comAlta = gravados.filter((p) => p.situacao === 'ALTA')
  const pendentes = res.pendentes || 0
  const mantidos = res.mantidos_com_alta ?? []
  // Pacientes que o censo tentou mover de seguradora e que NÃO foram movidos.
  const conflitos = res.conflitos_operadora ?? []
  // Os avisos do leitor entram classificados: o que significa "faltou paciente"
  // deixa de ter a mesma cara de "dia sem internados".
  const avisos = classificarAvisos(res.avisos ?? [])
  const acionaveis = avisos.filter((a) => a.nivel !== 'nota')
  const notas = avisos.filter((a) => a.nivel === 'nota')
  // Dupla checagem da operadora: um censo é do HOSPITAL e pode trazer pacientes
  // de vários convênios. Cada um foi gravado na operadora do convênio dele, e não
  // na que o usuário escolheu no passo 1 — o que é o certo, mas tem de ser dito.
  const divergentes = res.operadoras_divergentes ?? []
  const naoReconhecidos = res.convenios_nao_reconhecidos ?? []
  const semConvenio = res.sem_convenio ?? []

  // Quem tem problema, DERIVADO das listas do arquivo — não só do campo
  // `problema` que o backend carimba em cada paciente.
  //
  // O campo é recente: um resultado gerado por um servidor que ainda não
  // recarregou vem sem ele, e a linha ficava sem marca nenhuma enquanto o aviso
  // acima dizia "3 pacientes têm convênio não reconhecido" — o usuário lia o
  // número e não achava ninguém. As listas `convenios_nao_reconhecidos` e
  // `operadoras_divergentes` já vinham antes e dizem QUEM é, então dá para
  // marcar a linha com o que a tela tem em mãos.
  //
  // Cálculo direto, sem `useMemo`: este ponto fica DEPOIS dos returns
  // antecipados do componente (arquivo digitalizado, erro de leitura, falta
  // hospital), e um hook aqui é chamado condicionalmente — o que quebra a ordem
  // dos hooks entre renderizações. O custo é desprezível: é um Map sobre listas
  // de poucas dezenas de itens.
  const problemaPorAtendimento = (() => {
    const mapa = new Map<string, { tipo: string; texto: string }>()
    for (const pac of naoReconhecidos) {
      const chave = String(pac.atendimento ?? '').trim()
      if (!chave) continue
      mapa.set(chave, {
        tipo: 'convenio_nao_reconhecido',
        texto: `Convênio “${pac.convenio ?? '—'}” não está no cadastro. `
          + 'entrou na operadora escolhida no envio.',
      })
    }
    for (const d of divergentes) {
      // `d.pacientes` é uma AMOSTRA (o backend manda até 5 por operadora, para a
      // resposta do upload não virar um despejo de fichas). Então este fallback
      // marca os primeiros, não todos — é o melhor possível sem o campo
      // `problema`, que vem completo por paciente. Com o backend atualizado o
      // campo vence e a limitação some.
      for (const pac of d.pacientes ?? []) {
        const chave = String(pac.atendimento ?? '').trim()
        if (!chave || mapa.has(chave)) continue
        mapa.set(chave, {
          tipo: 'outra_operadora',
          texto: `Convênio “${pac.convenio ?? '—'}”: entrou em `
            + `${d.operadora_nome || d.operadora_key}, não na operadora escolhida.`,
        })
      }
    }
    return mapa
  })()

  const aplicarEdicoes = (lista: PacienteGravado[]) =>
    lista
      .filter((p) => p.id == null || !removidos.includes(p.id))
      .map((p) => (p.id != null && editados[p.id]) || p)
      // O campo do backend vence; o derivado entra só quando ele não veio.
      //
      // `resolvido` sai da frente das duas regras: quem foi corrigido na modal
      // volta marcado, e sem isso o mapa derivado remontaria o aviso (o campo
      // vem `null`, que o teste de veracidade le como "nao veio") — a linha
      // voltaria a acusar o problema que o usuario acabou de corrigir.
      .map((p) => (p.resolvido || p.problema ? p : {
        ...p,
        problema: problemaPorAtendimento.get(String(p.atendimento ?? '').trim()) ?? null,
      }))
  // Quantos pacientes ainda têm alerta, JÁ considerando as edições e remoções
  // desta tela — corrigir um na modal tem de baixar o número na hora, senão o
  // botão continuaria prometendo linhas que não existem mais.
  const leitoVisto = aplicarEdicoes(emLeito)
  const altaVista = aplicarEdicoes(comAlta)
  const nProblemas = contarProblemas(leitoVisto, altaVista)

  // Os avisos do painel contam só quem AINDA tem o problema. `naoReconhecidos` e
  // `divergentes` vêm do processamento e não mudam quando o usuário corrige um
  // paciente na modal — o aviso continuava dizendo "1 paciente tem convênio que o
  // sistema não reconhece" depois de o convênio ter sido corrigido.
  //
  // Só sai daqui quem foi RESOLVIDO na modal, ou removido da lista. Testar "não
  // tem `problema`" seria mais largo e erraria: o campo é recente e um resultado
  // de servidor antigo vem sem ele em TODO paciente — o aviso sumiria inteiro,
  // calado, justamente onde a marcação da linha depende do mapa derivado. Um
  // alerta a menos é pior que um a mais: ninguém procura o que a tela não
  // menciona.
  //
  // Cálculo direto, sem `useMemo`: este ponto do componente fica DEPOIS dos
  // returns antecipados (arquivo digitalizado, erro de leitura, falta hospital),
  // e um hook aqui seria chamado condicionalmente — a regra que o React exige
  // para manter a ordem dos hooks entre renderizações.
  const resolvidos = (() => {
    const presentes = new Set<string>()
    const fora = new Set<string>()
    for (const p of [...leitoVisto, ...altaVista]) {
      const chave = String(p.atendimento ?? '').trim()
      if (!chave) continue
      presentes.add(chave)
      if (p.resolvido) fora.add(chave)
    }
    // Removido da lista (o X da linha) também não pode continuar sendo contado.
    for (const p of [...naoReconhecidos, ...semConvenio,
                     ...divergentes.flatMap((d) => d.pacientes ?? [])]) {
      const chave = String(p.atendimento ?? '').trim()
      if (chave && !presentes.has(chave)) fora.add(chave)
    }
    // Os atendimentos completos dos divergentes: é por eles que se percebe a
    // remoção de alguém que não estava entre os 5 nomes da amostra.
    for (const d of divergentes) {
      for (const a of d.atendimentos ?? []) {
        const chave = String(a ?? '').trim()
        if (chave && !presentes.has(chave)) fora.add(chave)
      }
    }
    return fora
  })()

  // Genérica para preservar o tipo do elemento: as listas carregam `nome` e
  // `convenio`, que o alerta exibe, e um parâmetro só com `atendimento` os
  // apagaria do tipo de retorno.
  const visiveis = <T extends { atendimento?: string | null }>(lista: T[]): T[] =>
    lista.filter((p) => !resolvidos.has(String(p.atendimento ?? '').trim()))

  const naoReconhecidosAbertos = visiveis(naoReconhecidos)
  const semConvenioAbertos = visiveis(semConvenio)

  // `pacientes` é AMOSTRA (5 nomes) e `atendimentos` traz TODOS. O desconto sai
  // dos atendimentos: com a amostra, remover um paciente fora dos 5 primeiros
  // deixava o alerta com a contagem antiga — o usuário removia e o aviso não
  // mexia. Sem `atendimentos` (resultado de servidor antigo), desconta o que a
  // amostra permite, que é o comportamento anterior.
  const divergentesAbertos = divergentes
    .map((d) => {
      const amostra = d.pacientes ?? []
      const abertos = visiveis(amostra)
      const todos = d.atendimentos
      const total = todos
        ? todos.filter((a) => !resolvidos.has(String(a ?? '').trim())).length
        : Math.max(0, (d.total ?? 0) - (amostra.length - abertos.length))
      return { ...d, pacientes: abertos, total }
    })
    .filter((d) => d.total > 0)

  // Quantos pacientes deste arquivo ainda estão em outra operadora. Some do
  // placar do lote quando chega a zero — é o que faz o badge do topo acompanhar
  // as correções feitas aqui dentro, em vez de repetir para sempre o retrato do
  // processamento.
  const divergentesEmAberto = divergentesAbertos.reduce((n, d) => n + d.total, 0)
  divergentesAtuais.current = divergentesEmAberto

  // Filtro ligado sem nada para mostrar = o usuário resolveu tudo enquanto via a
  // lista recortada. Vale como DERIVADO, não como efeito: o componente tem
  // returns antecipados acima (erro, falta hospital), então um hook aqui não
  // rodaria em toda renderização. Assim o estado guarda a intenção e a lista
  // volta a ser inteira sozinha quando não há mais o que marcar.
  const filtrando = somenteProblema && nProblemas > 0

  // Quantos avisos este arquivo tem, por gravidade — é o que a linha recolhida
  // mostra no lugar das frases. Conta tudo o que o painel vai exibir: os avisos
  // do leitor mais os dois da conferência de operadora (divergência e convênio
  // não reconhecido), que são `atencao` por natureza.
  // O contador tem de bater com o que o painel MOSTRA: cada alerta ali dentro
  // conta um. Deixar a pendência de fora faria a linha fechada dizer "1" e o
  // usuário abrir para encontrar dois alertas.
  // `mantidos_com_alta` NÃO entra: é nível `nota` (o censo repetindo quem já
  // saiu), e notas nunca viram número — seria o alarme falso que a tela evita.
  const nCriticos = acionaveis.filter((a) => a.nivel === 'critico').length
  const nAtencoes = acionaveis.filter((a) => a.nivel === 'atencao').length
    + divergentesAbertos.length
    + (naoReconhecidosAbertos.length > 0 ? 1 : 0)
    + (semConvenioAbertos.length > 0 ? 1 : 0)
    + (pendentes > 0 ? 1 : 0)
    // O conflito de operadora conta: é um alerta que o painel exibe, e o número
    // da linha fechada tem de bater com o que se encontra ao abrir.
    + (conflitos.length > 0 ? 1 : 0)

  // A cor do cartão pelo estado ATUAL, e não pelo retrato do processamento.
  //
  // `urgencia` é calculada do resultado cru que veio do backend, então um
  // arquivo marcado por "pacientes em outra operadora" seguia laranja depois de
  // o último deles ter sido corrigido ou removido — a tela continuava pedindo
  // uma conferência que já tinha sido feita. Zerados os alertas, o cartão vira
  // positivo.
  //
  // `decisao` fica de fora: erro de leitura, falta de hospital e pendências não
  // se resolvem na lista de pacientes, e nenhuma correção daqui os apaga.
  const limpoAgora = urgencia === 'revisar' && nCriticos === 0 && nAtencoes === 0

  // TODO cartão recolhe. A versão anterior travava aberto o que tivesse aviso
  // ("esconder o que o leitor diz é o mesmo que não dizer") e o efeito foi o
  // oposto do pretendido: num lote em que todos os arquivos têm aviso, nenhum
  // podia ser fechado, a tela virava uma parede de listas e alertas, e não havia
  // como isolar um arquivo para entender o problema dele.
  //
  // O que aquele raciocínio protegia continua protegido: os AVISOS ficam fora do
  // painel recolhível — visíveis sempre, abertos ou fechados. O que recolhe é a
  // LISTA de pacientes, que é volume, não alerta.
  const nInternados = res.internados ?? 0
  const nAltas = res.altas ?? 0

  // Só o que identifica o arquivo fica DENTRO do botão de expandir. A data e a
  // busca vão à direita, como irmãs do botão: a data tinha `margin-left:auto` e,
  // estando dentro dele, empurrava a lupa para depois de si — fora da ordem que
  // se quer ler (o que é o arquivo → de que dia → procurar dentro dele).
  // O HOSPITAL não entra aqui: ele é o mesmo para todo o lote (foi escolhido no
  // passo 1 do envio e aparece no cabeçalho da página), então repeti-lo em cada
  // linha gasta a parte mais valiosa do cabeçalho com o dado que menos varia. Na
  // linha fica o que MUDA de arquivo para arquivo — o que foi extraído dele; o
  // hospital vai para dentro dos detalhes, onde serve de conferência.
  const cabecalho = (
    <span className="up-arquivo-nome" title={res.arquivo}>{res.arquivo}</span>
  )

  // Id do painel que o botão "Detalhes" abre — `aria-controls` precisa apontar
  // para um id real, e há um cartão por arquivo na mesma tela.
  const idPainel = `up-painel-${res.arquivo.replace(/[^\w-]/g, '_')}`

  // A busca só faz sentido com a lista aberta e com nomes para procurar.
  // Ao lado dela, o filtro de marcados — presente só quando há o que filtrar.
  const busca = expandido && gravados.length > 0 ? (
    <>
      {nProblemas > 0 && (
        <button
          type="button"
          className={`up-so-problema${filtrando ? ' ativo' : ''}`}
          aria-pressed={filtrando}
          onClick={() => setSomenteProblema((v) => !v)}
          title={filtrando
            ? 'Mostrar todos os pacientes do arquivo'
            : 'Mostrar só os pacientes que precisam de decisão'}
        >
          {filtrando ? 'Mostrando marcados' : `Ver ${nProblemas} marcados`}
        </button>
      )}
      <BuscaPacientes
        termo={termoBusca}
        onTermo={setTermoBusca}
        achados={filtrarPacientes(emLeito, termoBusca).length
          + filtrarPacientes(comAlta, termoBusca).length}
        total={gravados.length}
      />
    </>
  ) : null

  return (
    <div className={`up-arquivo ${urgencia === 'ok' || limpoAgora ? 'ok' : 'atencao'}`}>
      {/* A linha inteira NÃO é um botão: o campo de busca fica nela, e um
          <input> dentro de um <button> é HTML inválido (além de o clique no
          campo fechar a lista que se quer pesquisar).
          Quem NOMEIA a ação é o botão "Detalhes", no fim da linha; clicar no
          nome do arquivo faz o mesmo, como atalho. Este atalho não repete
          `aria-expanded`/`aria-controls` de propósito: dois controles anunciando
          a mesma expansão fariam o leitor de tela dizer tudo duas vezes — aqui
          ele se apresenta pelo que é (abrir os detalhes daquele arquivo). */}
      <div className="up-arquivo-topo">
        <button
          type="button"
          className="up-arquivo-head"
          aria-label={`${expandido ? 'Ocultar' : 'Ver'} detalhes de ${res.arquivo}`}
          onClick={() => setEscolhaDoUsuario(!expandido)}
        >
          {cabecalho}
          {/* A contagem fica na linha SEMPRE, aberta ou fechada: ela é o dado
              extraído do arquivo, não um substituto do conteúdo escondido. */}
          <span className="up-arquivo-resumo">
            {nInternados > 0 && (
              <span className="n-int">
                {nInternados} {plural(nInternados, 'internação', 'internações')}
              </span>
            )}
            {nInternados > 0 && nAltas > 0 && ', '}
            {nAltas > 0 && (
              <span className="n-alta">{nAltas} {plural(nAltas, 'alta')}</span>
            )}
            {nInternados === 0 && nAltas === 0 && <>nenhum paciente</>}
          </span>
        </button>
        {/* Fim da linha, na ordem em que se lê: procurar dentro do arquivo, de
            que dia ele é, e abrir o que veio nele. */}
        <span className="up-arquivo-fim">
          {/* Só com o cartão FECHADO: aberto, as frases logo abaixo dizem o
              mesmo com mais precisão, e o número viraria ruído. */}
          {!expandido && (
            <ContadorAvisos criticos={nCriticos} atencoes={nAtencoes} />
          )}
          {busca}
          <DataDoCenso iso={res.data_censo} />
          {/* Botão ESCRITO, não só uma seta: "Detalhes" diz o que há para ver,
              enquanto um chevron sozinho deixa o usuário adivinhar se aquilo
              abre alguma coisa. `aria-controls` liga o botão ao painel que ele
              abre, para quem usa leitor de tela saber o que foi expandido. */}
          <button
            type="button"
            className={`up-detalhes${expandido ? ' aberto' : ''}`}
            aria-expanded={expandido}
            aria-controls={idPainel}
            onClick={() => setEscolhaDoUsuario(!expandido)}
          >
            {expandido ? 'Ocultar' : 'Detalhes'}
            <span className="up-arquivo-seta" aria-hidden>{IcoChevron}</span>
          </button>
        </span>
      </div>

      {expandido && (
        <div id={idPainel} className="up-painel">
          {/* Avisos ANTES da lista: ficando depois dela,
              um arquivo de 99 pacientes empurrava o alerta para o fim de uma tabela
              rolável — quem abria o cartão para entender o problema tinha de passar
              por todos os nomes até achá-lo. Ficam visíveis com o cartão aberto ou
              fechado: são a razão de ele não estar limpo. */}
          {acionaveis.map((a, j) => (
            <Alerta key={`av-${j}`} nivel={a.nivel}>{a.texto}</Alerta>
          ))}

          {/* Censo misto: parte dos pacientes é de outra operadora. Nível `atencao`,
              não `critico` — nada se perdeu e nada está errado; cada um foi para a
              operadora certa. O que o usuário precisa é CONFERIR que era isso mesmo,
              porque a outra leitura possível é ter subido o censo no lugar errado. */}
          {divergentesAbertos.map((d) => (
            <Alerta key={d.operadora_key} nivel="atencao">
              O convênio {plural(d.total, 'de', 'de')} <b>{d.total}{' '}
              {plural(d.total, 'paciente')}</b> deste censo é da{' '}
              <b>{d.operadora_nome || d.operadora_key}</b>, e não{' '}
              {res.operadora_escolhida ? <>da <b>{res.operadora_escolhida}</b></> : 'da operadora escolhida'}
              {' '}no envio. {plural(d.total, 'Ele entrou', 'Eles entraram')} na operadora
              do próprio convênio, que é o certo. Confira{' '}
              {plural(d.total, 'se é esse paciente mesmo', 'se são esses pacientes mesmo')}
              {/* A frase prometia a marcação e parava aí: em 60 nomes, achá-los
                  era rolar atrás da faixa colorida, e os nomes citados são no
                  máximo 5. O link recorta a lista em quem precisa de decisão —
                  ali cada linha tem o lápis (ajustar a operadora) e o X
                  (remover), que são as duas saídas do caso. */}
              {nProblemas > 0 && (
                <>
                  {' '}(
                  <button type="button" className="up-link-filtro"
                          onClick={() => setSomenteProblema(true)}>
                    ver na lista
                  </button>
                  )
                </>
              )}.
              {d.pacientes.length > 0 && (
                <span className="up-exemplos">
                  {d.pacientes.map((p) => nomeProprio(p.nome) || p.atendimento || '—').join(', ')}
                  {d.total > d.pacientes.length && ` e mais ${d.total - d.pacientes.length}`}.
                </span>
              )}
            </Alerta>
          ))}

          {/* Convênio impresso que o cadastro não reconhece: o paciente entrou sob a
              operadora escolhida. É falha de CADASTRO (falta vincular esse convênio),
              e some sozinha quando alguém o cadastra — por isso atenção, não erro. */}
          {naoReconhecidosAbertos.length > 0 && (
            <Alerta nivel="atencao">
              <b>{naoReconhecidosAbertos.length}{' '}
                {plural(naoReconhecidosAbertos.length, 'paciente')}</b>{' '}
              {plural(naoReconhecidosAbertos.length, 'veio', 'vieram')} com um convênio que
              não está no cadastro, então{' '}
              {plural(naoReconhecidosAbertos.length, 'entrou', 'entraram')} na operadora
              escolhida no envio — que pode não ser a{' '}
              {plural(naoReconhecidosAbertos.length, 'dele', 'deles')}. Corrija o convênio
              na linha, ou cadastre esse convênio para os próximos censos.
              {nProblemas > 0 && (
                <>
                  {' '}(
                  <button type="button" className="up-link-filtro"
                          onClick={() => setSomenteProblema(true)}>
                    ver {plural(naoReconhecidosAbertos.length, 'quem é', 'quem são')}
                  </button>
                  )
                </>
              )}
              <span className="up-exemplos">
                {[...new Set(naoReconhecidosAbertos.map((p) => p.convenio).filter(Boolean))]
                  .slice(0, 4).join(', ')}.
              </span>
            </Alerta>
          )}

          {/* Sem convênio NENHUM no arquivo. Era o caso mudo: a linha do paciente
              já vinha marcada, e o painel não dizia nada sobre a marca — o
              usuário via o alerta na lista e não achava a explicação em lugar
              nenhum. Nível `atencao` como os vizinhos: o paciente ENTROU, nada
              se perdeu; o que falta é o dado que define as regras dele. */}
          {semConvenioAbertos.length > 0 && (
            <Alerta nivel="atencao">
              O censo não trouxe o convênio de <b>{semConvenioAbertos.length}{' '}
                {plural(semConvenioAbertos.length, 'paciente')}</b>.{' '}
              {plural(semConvenioAbertos.length, 'Ele entrou', 'Eles entraram')} normalmente,
              mas sem convênio não dá para saber quais regras de prazo{' '}
              {plural(semConvenioAbertos.length, 'valem para ele', 'valem para eles')}.
              {nProblemas > 0 && (
                <>
                  {' '}(
                  <button type="button" className="up-link-filtro"
                          onClick={() => setSomenteProblema(true)}>
                    ver na lista
                  </button>
                  )
                </>
              )}
              <span className="up-exemplos">
                {semConvenioAbertos.slice(0, 4)
                  .map((p) => nomeProprio(p.nome) || p.atendimento || '—').join(', ')}
                {semConvenioAbertos.length > 4
                  && ` e mais ${semConvenioAbertos.length - 4}`}.
              </span>
            </Alerta>
          )}

          {/* Pendências e "mantidos com alta" seguem o MESMO conceito dos
              avisos acima: mesmo componente, mesma coluna, mesma gravidade
              declarada. Antes ficavam fora do painel e depois da lista, o que
              os fazia parecer outra categoria de informação — e num arquivo
              longo iam parar no fim de uma tabela rolável.
              A frase completa ("N vieram com dado faltando e aguardam sua
              decisão") mora na FAIXA do lote, que tem o botão "Completar agora";
              aqui o cartão diz só a parte que é DELE. */}
          {pendentes > 0 && (
            <Alerta nivel="atencao">
              {pendentes} {plural(pendentes, 'paciente', 'pacientes')}{' '}
              {plural(pendentes, 'deste arquivo aguarda', 'deste arquivo aguardam')}{' '}
              sua decisão.
            </Alerta>
          )}

          {/* Já tinham alta e o censo não os reabriu. Não é erro — é o censo
              repetindo quem já saiu —, mas precisa ser dito: a contagem de
              gravados, sozinha, não explicaria por que essas linhas não entraram.
              Os nomes vêm junto porque é por eles que se reconhece o caso. */}
          {/* Antes dos demais avisos: é o único que fala de um dado que ficou
              DIFERENTE do que o censo mandou, e a decisão é do usuário. */}
          {conflitos.length > 0 && (
            <Alerta nivel="atencao">
              {conflitos.length} {plural(conflitos.length, 'paciente')}{' '}
              {plural(conflitos.length, 'está', 'estão')} em outra operadora e{' '}
              {plural(conflitos.length, 'continuou', 'continuaram')} onde{' '}
              {plural(conflitos.length, 'estava', 'estavam')}: nenhum censo troca a
              seguradora de quem já existe.{' '}
              {conflitos.slice(0, 3).map((c) => (
                `${nomeProprio(c.nome) || c.atendimento}: está em ${c.operadora_atual}, `
                + `o censo trouxe ${c.operadora_do_censo}`
              )).join('; ')}
              {conflitos.length > 3 && ` e mais ${conflitos.length - 3}`}.
              {' '}Confira o convênio no PDF e, se o certo for o do censo, corrija
              pelo lápis na linha do paciente.
            </Alerta>
          )}
          {mantidos.length > 0 && (
            <Alerta nivel="nota">
              {mantidos.length} {plural(mantidos.length, 'paciente')} já{' '}
              {plural(mantidos.length, 'tinha', 'tinham')} alta e{' '}
              {plural(mantidos.length, 'continua', 'continuam')} como{' '}
              {plural(mantidos.length, 'estava', 'estavam')}:{' '}
              {mantidos.slice(0, 4).map((m) => nomeProprio(m.nome) || m.atendimento).join(', ')}
              {mantidos.length > 4 && ` e mais ${mantidos.length - 4}`}.
            </Alerta>
          )}
          {gravados.length > 0 ? (
            // Abrir o arquivo já mostra QUEM veio, separado por situação. Antes
            // havia um segundo clique (os chips) para escolher um grupo por vez —
            // dois níveis de expansão para chegar a um nome, e metade da resposta
            // escondida em cada estado.
            <ListaPacientes
              emLeito={leitoVisto}
              comAlta={altaVista}
              termo={termoBusca}
              somenteProblema={filtrando}
              onEditar={somenteLeitura ? undefined : setEditando}
              onRemover={(somenteLeitura || !podeExcluir) ? undefined : (p) => {
                setErroRemover(null)
                setRemovendo(p)
              }}
            />
          ) : (
            // Arquivo lido antes desta função: temos as contagens, não os nomes.
            <div className="up-grupos">
              {nInternados > 0 && (
                <span className="up-grupo-mudo internado">
                  {nInternados} {plural(nInternados, 'internação', 'internações')}
                </span>
              )}
              {nAltas > 0 && (
                <span className="up-grupo-mudo alta">{nAltas} {plural(nAltas, 'alta')}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notas do leitor: confirmação de que ele fez a coisa certa. Recolhidas —
          visíveis para quem procurar, sem competir com o que pede ação. */}
      {notas.length > 0 && (
        <details className="up-notas-det">
          <summary>
            <span className="up-notas-seta">{IcoChevron}</span>
            {notas.length} {plural(notas.length, 'nota')} da leitura
          </summary>
          <div className="up-arquivo-notas">
            {notas.map((a, j) => <Alerta key={`nt-${j}`} nivel="nota">{a.texto}</Alerta>)}
          </div>
        </details>
      )}

      {/* Desfazer só ESTE arquivo. Fica dentro dos detalhes, no fim: é destrutivo,
          e quem o alcança já passou pela lista de quem entrou — a decisão vem
          depois da conferência, não antes dela. O botão do LOTE continua no
          rodapé do resultado, para o caso de tudo ter ido para o hospital
          errado. */}
      {expandido && onDesfazer && (res.criados ?? 0) > 0 && (
        <div className="up-arquivo-desfazer">
          <span>
            Este arquivo criou <b>{res.criados}</b> {plural(res.criados ?? 0, 'paciente')}.
            {(res.atualizados?.length ?? 0) > 0 && (
              <> Outros {res.atualizados?.length} já existiam e permanecem.</>
            )}
          </span>
          <button type="button" className="up-desfazer-arq"
                  disabled={desfazendo}
                  onClick={() => onDesfazer(res.arquivo)}>
            {desfazendo ? 'Desfazendo…' : 'Desfazer este arquivo'}
          </button>
        </div>
      )}

      {apagado && (
        <AvisoDesfazer
          texto={<><b>{nomeProprio(apagado.paciente.nome) || apagado.paciente.atendimento
            || 'Paciente'}</b> foi removido.</>}
          detalhe="Relatórios e histórico dele não voltam com o desfazer."
          desfazendo={desfazendoRemocao}
          onDesfazer={desfazerRemocao}
          onFechar={() => setApagado(null)}
        />
      )}

      {saiuDaLista && (
        <AvisoDesfazer
          texto={<><b>{saiuDaLista}</b> saiu da lista deste censo.</>}
          detalhe="A ficha dele continua no sistema, com relatórios e histórico."
          onFechar={() => setSaiuDaLista(null)}
        />
      )}

      {removendo && (
        <ConfirmarModal
          titulo="Remover do censo?"
          confirmar="Remover do censo"
          cancelar="Manter"
          ocupado={apagando}
          onCancelar={() => setRemovendo(null)}
          onConfirmar={confirmarRemocao}
        >
          {/* Uma frase só. A ação é a que o botão nomeia, e quem decide o
              destino da ficha é o backend (ele conhece a origem do registro e em
              quantos censos ele aparece). Explicar a regra inteira aqui era
              texto que ninguém lê antes de um clique de rotina — o retorno conta
              o que de fato aconteceu. O nome vai pelo `nomeProprio` porque os
              censos chegam em CAIXA ALTA e este texto é uma frase, não uma
              célula de tabela. */}
          <div>
            <strong>{nomeProprio(removendo.nome) || removendo.atendimento
              || 'Este registro'}</strong>{' '}
            sai da lista deste censo. A ficha dele continua no sistema.
          </div>
          {erroRemover && (
            <div style={{ color: 'var(--danger-2)' }}>{erroRemover}</div>
          )}
        </ConfirmarModal>
      )}

      {editando && (
        <EditarPacienteModal
          paciente={editando}
          operadoras={operadoras}
          onFechar={() => setEditando(null)}
          onSalvo={(atualizado) => {
            if (atualizado.id != null) {
              setEditados((e) => ({ ...e, [atualizado.id as number]: atualizado }))
            }
            // O placar do LOTE é somado fora do cartão, a partir do resultado do
            // processamento, e não enxerga esta correção — sem avisar, o badge
            // do topo seguia dizendo "1 convênio não reconhecido" depois de o
            // convênio ter sido corrigido aqui.
            //
            // Avisado daqui, e não de um efeito: este ponto do componente fica
            // depois dos returns antecipados, onde um hook seria condicional. E
            // é o momento exato em que a correção acontece.
            if (atualizado.resolvido && naoReconhecidos.some(
                (p) => String(p.atendimento ?? '').trim()
                  === String(atualizado.atendimento ?? '').trim())) {
              onConveniosResolvidos?.(res.arquivo, 1)
            }
          }}
        />
      )}
    </div>
  )
}
