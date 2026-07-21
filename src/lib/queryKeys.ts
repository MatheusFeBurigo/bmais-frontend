// Fábrica única de chaves de cache do React Query.
//
// Antes, cada tela montava sua queryKey inline (['dashboard', op, ...],
// ['sidebar'], ...). Strings soltas espalhadas causam divergência (uma tela usa
// 'sidebar', outra digita errado) e tornam a invalidação frágil. Aqui cada
// domínio tem UMA função que produz sua chave — a fonte de verdade. `as const`
// preserva os literais para o TypeScript casar chaves na invalidação.

export const queryKeys = {
  dashboard: (operadora: string, filtro: string, hospital: string) =>
    ['dashboard', operadora, filtro, hospital] as const,

  dashboardOverview: () => ['dashboard-overview'] as const,

  sidebar: () => ['sidebar'] as const,

  diretoria: () => ['diretoria'] as const,

  gestor: (data: string, operadora: string, hospital: string, regiao: string, janela: string) =>
    ['gestor', data, operadora, hospital, regiao, janela] as const,

  configuracoes: (op: string, hospital: string) =>
    ['configuracoes', op, hospital] as const,

  equipe: () => ['equipe'] as const,
  profissional: (id: number | null) => ['prof', id] as const,
  hospitais: (op: string) => ['hospitais', op] as const,

  usuarios: () => ['usuarios'] as const,

  internacaoDados: (id: number) => ['internacao-dados', id] as const,
  internacaoTimeline: (id: number) => ['internacao-timeline', id] as const,
} as const

// Raiz (primeiro segmento) de cada domínio — usada para invalidar TODAS as
// variações de uma chave (ex.: todos os ['dashboard', ...] independente dos
// filtros). O React Query casa por prefixo, então a raiz basta.
export const queryRoots = {
  dashboard: ['dashboard'] as const,
  dashboardOverview: ['dashboard-overview'] as const,
  sidebar: ['sidebar'] as const,
  diretoria: ['diretoria'] as const,
  gestor: ['gestor'] as const,
  configuracoes: ['configuracoes'] as const,
  equipe: ['equipe'] as const,
  usuarios: ['usuarios'] as const,
} as const

export type QueryRoot = keyof typeof queryRoots
