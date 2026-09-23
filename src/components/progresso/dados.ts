// Avanço dos módulos do projeto: os dados que a tela Progresso exibe.
//
// Traduzidos de `BMais_Avanco_Modulos.html` (conferência do programador contra
// o código, 16/09/2026). São números de ACOMPANHAMENTO DE OBRA, apurados à mão
// — não saem de nenhuma API, e por isso vivem aqui como conteúdo versionado:
// quando houver nova conferência, edite este arquivo e a data abaixo.
//
// Se um dia o avanço passar a ser calculado pelo backend, este módulo vira o
// contrato que o endpoint precisa devolver.

/** Data da última conferência. Aparece na tela, para ninguém ler os números
 *  como se fossem de hoje. */
export const ATUALIZADO_EM = '16/09/2026'

/** Avanço geral do projeto, em pontos percentuais. */
export const AVANCO_GERAL = 35

/** As seis etapas por que todo módulo passa, na ordem. */
export const ETAPAS: readonly string[] = [
  'Escopo e proposta',
  'Aprovação do front',
  'Em desenvolvimento',
  'Entrega do módulo',
  'Testes e ajustes',
  'Entrega final',
]

/** Situação de cada etapa, derivada do percentual dela (ver calculo.ts). */
export type FaseStatus = 'done' | 'current' | 'pending'

/** Os quatro grupos, do mais adiantado ao mais distante. A ordem é a da tela. */
export type GrupoModulo = 'Em construção' | 'Iniciados' | 'A construir' | 'A estudar'

export const GRUPOS: readonly GrupoModulo[] = [
  'Em construção', 'Iniciados', 'A construir', 'A estudar',
]

export interface ModuloProjeto {
  /** Identificador curto exibido antes do nome (ex.: "Mód. 0", "App"). */
  id: string
  nome: string
  grupo: GrupoModulo
  /** Rótulo da pastilha: o mesmo do grupo, no singular. */
  status: string
  /** Avanço do módulo. DERIVADO das etapas (média) desde a migration 0031 —
   *  mantido aqui como o valor da conferência de origem, e recalculado na tela. */
  pct: number
  /** Avanço de CADA etapa, na ordem de ETAPAS: [100, 100, 70, 0, 0, 0].
   *  100 = concluída, 1..99 = em andamento, 0 = não iniciada.
   *
   *  Semeado a partir do `pct` da conferência (distribuição em cascata: cada
   *  etapa recebe até 100 até esgotar o total), para a tela abrir nos números
   *  que a diretoria já conhece. O documento de origem trazia também uma "etapa
   *  atual" que CONTRADIZIA o percentual — 92% com três etapas sem começar, e o
   *  teto nesse caso é 50%. Preservamos o percentual, que é o que vinha sendo
   *  reportado; a partir daqui, quem manda é o ajuste feito na tela. */
  etapasPct: readonly number[]
  /** Legenda sob cada etapa, quando há prazo definido. `previsto` é a data de
   *  término estimada — some quando não há previsão (módulo ainda sem data).
   *
   *  Aceita `null` nos campos porque é assim que o ajuste manual os grava: o
   *  backend distingue "sem data" (null) de "não mexeu" (ausente). */
  datas?: readonly { inicio?: string | null; previsto?: string | null }[]
  /** True quando as etapas NÃO vieram da conferência: foram deduzidas do
   *  percentual, porque a origem trazia avanço sem etapa marcada. A tela avisa,
   *  para o número não passar por apurado. */
  inferido?: boolean
}

// Ordem idêntica à do documento de origem: dentro de cada grupo, do maior para
// o menor avanço já era a ordem de lá, então nada é reordenado em tela.
export const MODULOS: readonly ModuloProjeto[] = [
  {
    id: 'Mód. 0',
    nome: 'Acesso e segurança',
    grupo: 'Em construção',
    status: 'Em construção',
    pct: 92,
    etapasPct: [100, 100, 100, 100, 100, 52],
    datas: [
      {}, {},
      { inicio: '27/08', previsto: '27/09' },
      { inicio: '27/09' },
      { inicio: '27/09', previsto: '27/10' },
      { inicio: '27/10' },
    ],
  },
  {
    id: 'Mód. 1',
    nome: 'Censos, relatórios e timeline',
    grupo: 'Em construção',
    status: 'Em construção',
    pct: 73,
    etapasPct: [100, 100, 100, 100, 38, 0],
    datas: [
      {}, {},
      { inicio: '27/08', previsto: '27/09' },
      { inicio: '27/09' },
      { inicio: '27/09', previsto: '27/10' },
      { inicio: '27/10' },
    ],
  },
  {
    id: 'Mód. 4',
    nome: 'Agenda de serviços',
    grupo: 'Iniciados',
    status: 'Iniciado',
    pct: 8,
    etapasPct: [48, 0, 0, 0, 0, 0],
    datas: [{}, { inicio: 'desde 15/09' }, {}, {}, {}, {}],
  },
  {
    id: 'Mód. 5A',
    nome: 'Gestão de prestadores',
    grupo: 'Iniciados',
    status: 'Iniciado',
    pct: 22,
    // Inferido: o documento de origem traz 22% com as seis etapas pendentes —
    // barra preenchida e trilha vazia se contradiziam em tela. Como o módulo
    // está no grupo "Iniciados", o escopo está fechado e a aprovação em curso.
    etapasPct: [100, 32, 0, 0, 0, 0],
    inferido: true,
  },
  {
    id: 'Mód. 2A',
    nome: 'Pré análise de contas',
    grupo: 'A construir',
    status: 'A construir',
    pct: 0,
    etapasPct: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'Mód. 2B',
    nome: 'Assistente com IA',
    grupo: 'A construir',
    status: 'A construir',
    pct: 0,
    etapasPct: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'Mód. 3',
    nome: 'Gestão financeira',
    grupo: 'A construir',
    status: 'A construir',
    pct: 0,
    etapasPct: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'Mód. 5B',
    nome: 'Gestão da qualidade',
    grupo: 'A construir',
    status: 'A construir',
    pct: 0,
    etapasPct: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'Mód. 6',
    nome: 'Inteligência de dados e BI',
    grupo: 'A construir',
    status: 'A construir',
    pct: 25,
    // Inferido pelo mesmo motivo do Mód. 5A (25% sem etapa alguma marcada).
    etapasPct: [100, 50, 0, 0, 0, 0],
    inferido: true,
  },
  {
    id: 'App',
    nome: 'Registro em campo',
    grupo: 'A estudar',
    status: 'A estudar',
    pct: 0,
    etapasPct: [0, 0, 0, 0, 0, 0],
  },
]

/** Quantos módulos há em cada grupo (os contadores do topo da tela). */
export function contarPorGrupo(): { grupo: GrupoModulo; total: number }[] {
  return GRUPOS.map((grupo) => ({
    grupo,
    total: MODULOS.filter((m) => m.grupo === grupo).length,
  }))
}
