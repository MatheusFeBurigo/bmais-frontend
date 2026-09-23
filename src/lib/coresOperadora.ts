// Cor de cada operadora, para ela se reconhecer de relance.
//
// A tela de envio e a conferência mostram o tempo todo listas divididas por
// operadora (abas de censo misto, fila de arquivos, placar). Todas em azul, a
// diferença entre "Bradesco" e "Porto Seguro" só existia no texto: para saber em
// que bloco se está, era preciso LER o rótulo toda vez. Uma cor por operadora
// deixa o mesmo bloco ser localizado pela mancha, antes da leitura.
//
// As cores seguem a marca de cada operadora (o azul da Bradesco, o vermelho da
// Porto Seguro, o laranja da SulAmérica), porque é o que o usuário já reconhece
// do dia a dia dele: ele vem do site da operadora e da papelada dela.
//
// Regras que as cores respeitam:
//  - COR NUNCA É O ÚNICO SINAL. Em toda parte onde ela aparece, o nome da
//    operadora está escrito junto. Quem não distingue matizes lê o nome, como
//    antes; a cor é um atalho para quem distingue, nunca a informação em si.
//  - O tom usado em TEXTO é sempre o escuro (`ink`), medido para passar no
//    contraste de 4.5:1 sobre o fundo claro correspondente. O tom vivo fica em
//    faixas, pontos e barras, onde não há texto por cima.
//  - Operadora desconhecida cai no cinza neutro. O cadastro cresce (hospitais
//    novos trazem convênios novos), e uma key sem cor definida não pode quebrar
//    a tela nem receber a cor de outra marca.

/** Paleta de uma operadora. `ink` é para texto, `cor` para faixas e pontos. */
export interface CorOperadora {
  /** Tom vivo da marca: faixas, pontos, barras. Nunca texto pequeno. */
  cor: string
  /** Tom escuro, com contraste suficiente para texto sobre `fundo`. */
  ink: string
  /** Fundo claro da mesma matiz. */
  fundo: string
}

const NEUTRA: CorOperadora = { cor: '#8595A6', ink: '#3A4D5E', fundo: '#F0F3F6' }

// As oito operadoras do cadastro (migration 0002). A key é a do banco, não o
// nome: o nome muda de grafia ("Care Plus" x "CarePlus") e a key não.
const CORES: Record<string, CorOperadora> = {
  // Vermelho da Bradesco.
  bradesco: { cor: '#CC092F', ink: '#9B0724', fundo: '#FCE8EC' },
  // Laranja da SulAmérica.
  sulamerica: { cor: '#EE7000', ink: '#A04B00', fundo: '#FDEEDF' },
  // Azul da Porto Seguro.
  porto: { cor: '#0046B5', ink: '#003585', fundo: '#E3ECFA' },
  // Laranja escuro do Itaú.
  itau: { cor: '#EC7000', ink: '#9E4B00', fundo: '#FDEEDF' },
  // Azul-petróleo da Allianz.
  allianz: { cor: '#00699C', ink: '#004D73', fundo: '#DFEEF6' },
  // Verde da Care Plus.
  careplus: { cor: '#00855B', ink: '#006142', fundo: '#DDF2EA' },
  // Roxo da Mediservice.
  mediservic: { cor: '#6B3FA0', ink: '#4E2D75', fundo: '#EDE6F6' },
  // Verde-limão da NotreDame Intermédica.
  notredame: { cor: '#5AA700', ink: '#3D7000', fundo: '#EDF6DF' },
}

/** Cor da operadora pela `key` do cadastro. Key desconhecida devolve o cinza
 *  neutro — o cadastro cresce, e uma operadora nova não pode herdar a cor de
 *  outra marca nem quebrar a tela. */
export function corOperadora(key?: string | null): CorOperadora {
  if (!key) return NEUTRA
  return CORES[key.trim().toLowerCase()] ?? NEUTRA
}

/** As variáveis CSS da operadora, para aplicar num elemento e deixar os filhos
 *  herdarem por `var()`. Evita repetir três `style` inline em cada peça. */
export function varsOperadora(key?: string | null): React.CSSProperties {
  const c = corOperadora(key)
  return {
    '--op-cor': c.cor,
    '--op-ink': c.ink,
    '--op-fundo': c.fundo,
  } as React.CSSProperties
}
