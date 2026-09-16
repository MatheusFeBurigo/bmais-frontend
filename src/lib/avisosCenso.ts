// Classificação dos avisos que os leitores de censo devolvem.
//
// O backend manda todos por um canal só (`UploadCensoResult.avisos: string[]`),
// como frase pronta, sem código nem grau. Na tela isso virava uma pilha de linhas
// cinzas iguais, onde "faltaram 2 dos 677 pacientes" tinha exatamente o mesmo peso
// visual de "dia sem internados" — e é assim que se ensina o usuário a ignorar o
// aviso: quando o alarme falso tem a cara do alarme de verdade, nenhum dos dois é
// lido.
//
// Aqui a frase é classificada em três níveis pelo que ELA PEDE de quem enviou:
//
//   critico  → falta dado no sistema, ou o censo pode estar no hospital errado.
//              Alguém tem de conferir o arquivo AGORA; sobe para o placar do lote.
//   atencao  → entrou, mas incompleto (sem convênio, sem atendimento, sem alta).
//              Não trava nada; fica visível no cartão do arquivo.
//   nota     → confirmação, não alerta ("dia sem internados", linhas repetidas
//              deduplicadas). Fica recolhida para não disputar atenção.
//
// A classificação é por PADRÃO DE TEXTO porque é o que existe: mudar o contrato do
// backend para carimbar o grau na origem seria melhor, mas obrigaria a tocar os ~30
// leitores de uma vez. Quando o texto não casa com nenhum padrão conhecido, o nível
// é `atencao` — o meio-termo: um aviso novo nunca nasce silenciado (o que esconderia
// um problema real), nem nasce gritando no placar (o que traria de volta o alarme
// falso que este módulo existe para evitar).

export type NivelAviso = 'critico' | 'atencao' | 'nota'

export interface AvisoClassificado {
  texto: string
  nivel: NivelAviso
}

/** Frases que significam "o arquivo tem mais gente do que entrou no sistema", em
 *  qualquer das redações dos leitores, mais a divergência de hospital. São os dois
 *  casos em que o envio pode ter perdido ou desviado dado de paciente. */
const CRITICOS: RegExp[] = [
  // "O PDF lista 677 pacientes e o sistema leu 675", "No setor X, o PDF informa…",
  // "o PDF declara N paciente(s) e foram lidos M", "o arquivo informa N saída(s)…"
  /\b(lista|informa|declara)\b[\s\S]*\b(leu|lidos|lidas)\b/i,
  // "O sistema leu 680 pacientes, mais que os 677 que o PDF informa" (duplicação).
  /mais que os\s+\d+/i,
  // Nenhum paciente lido: o arquivo foi reconhecido e mesmo assim veio vazio.
  /nenhum(a)? (paciente|linha)[\s\S]*(foi lid|lido|reconhecid)/i,
  /nenhum paciente lido/i,
  // "o arquivo tem 40 linha(s) mas nenhuma foi reconhecida como paciente": o
  // arquivo TEM conteúdo e mesmo assim nada entrou — é perda, não dia vazio.
  /nenhuma foi reconhecid/i,
  // "não foi possível ler os dados deste arquivo" / "…este CSV: falta a coluna X".
  /n(ã|a)o foi poss(í|i)vel (ler|abrir)/i,
  /n(ã|a)o tem as colunas de um censo/i,
  // Linhas com cara de paciente que o leitor não conseguiu interpretar.
  /n(ã|a)o puderam ser lidas/i,
]

/** Entrou, mas com campo faltando — ou com algo a conferir. Não perde paciente. */
const ATENCAO: RegExp[] = [
  // Hospital divergente ("o arquivo indica X, mas foi enviado como Y"): ALERTA,
  // não erro. Nada se perdeu — os pacientes entraram —, e o caso mais comum é
  // falso positivo: o PDF traz a razão social ("HOSPITAL ESPERANCA SA") e o
  // cadastro o nome comercial, ou a assinatura do gerador cita a rede em vez da
  // unidade. Tratá-lo como crítico o punha na mesma prateleira de "faltaram 2
  // dos 677 pacientes" e no contador de erros do lote, o que é alarme falso —
  // exatamente o que treina a ignorar o aviso.
  /mas foi enviado como/i,
  /sem o conv(ê|e)nio identificado/i,
  /sem o n(ú|u)mero de atendimento/i,
  /sem data de alta leg(í|i)vel/i,
  /n(ã|a)o traz coluna de data de alta/i,
]

/** Confirmação de que o leitor fez a coisa certa — ou de que não havia o que fazer. */
const NOTAS: RegExp[] = [
  // "Este relatório não lista nenhum paciente (dia sem internados)."
  /dia sem internados/i,
  // "o arquivo trazia N linha(s) repetida(s) …; cada paciente foi contado uma vez"
  /contado uma vez/i,
  // "o cabeçalho foi reconhecido, mas nenhum paciente foi lido — se o relatório
  //  realmente não tem pacientes, confirme": o leitor achou o layout e o documento
  //  é que está vazio. Vem depois de CRITICOS de propósito? Não: é um caso legítimo
  //  de censo vazio, e por isso é tratado aqui — ver `classificarAviso`.
  /realmente n(ã|a)o tem pacientes/i,
  /o arquivo est(á|a) vazio/i,
]

/** Nível de uma frase de aviso. */
export function classificarAviso(texto: string): NivelAviso {
  // As notas são testadas ANTES dos críticos: "o cabeçalho foi reconhecido, mas
  // nenhum paciente foi lido — se o relatório realmente não tem pacientes,
  // confirme" casa com o padrão de "nenhum paciente lido", mas é o caso do dia sem
  // movimento, que o próprio texto explica. Sem esta ordem o censo vazio legítimo
  // voltaria a aparecer como falha no placar.
  if (NOTAS.some((re) => re.test(texto))) return 'nota'
  if (CRITICOS.some((re) => re.test(texto))) return 'critico'
  if (ATENCAO.some((re) => re.test(texto))) return 'atencao'
  return 'atencao'
}

/** Classifica a lista inteira, mantendo a ordem em que o leitor a produziu. */
export function classificarAvisos(avisos: readonly string[]): AvisoClassificado[] {
  return avisos.map((texto) => ({ texto, nivel: classificarAviso(texto) }))
}

/** Quantos avisos de cada nível — o placar do lote usa para decidir o que mostrar. */
export function contarPorNivel(avisos: readonly AvisoClassificado[]): Record<NivelAviso, number> {
  const n: Record<NivelAviso, number> = { critico: 0, atencao: 0, nota: 0 }
  for (const a of avisos) n[a.nivel] += 1
  return n
}
