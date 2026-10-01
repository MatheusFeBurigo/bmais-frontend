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

  gestor: (data: string, operadora: string, hospital: string, regiao: string, janela: string,
           inicio: string, fim: string) =>
    ['gestor', data, operadora, hospital, regiao, janela, inicio, fim] as const,

  configuracoes: (op: string, hospital: string) =>
    ['configuracoes', op, hospital] as const,

  /** Convênios já vistos nos censos (dropdown da conferência do envio). */
  convenios: () => ['convenios'] as const,

  equipe: () => ['equipe'] as const,
  profissional: (id: number | null) => ['prof', id] as const,
  hospitais: (op: string) => ['hospitais', op] as const,
  /** Ficha cadastral de UM hospital (GET /api/hospital/{key}). */
  hospital: (key: string) => ['hospital', key] as const,
  hospitalTimeline: (key: string) => ['hospital', key, 'timeline'] as const,
  /** Regras de cobranca do hospital por operadora (GET /api/hospital/{key}/regras). */
  hospitalRegras: (key: string) => ['hospital', key, 'regras'] as const,

  usuarios: () => ['usuarios'] as const,

  internacaoDados: (id: number) => ['internacao-dados', id] as const,
  internacaoTimeline: (id: number) => ['internacao-timeline', id] as const,
  internacaoRelatorios: (id: number) => ['internacao-relatorios', id] as const,
  /** CIDs vinculados ao paciente (card "CID" da ficha). */
  internacaoCids: (id: number) => ['internacao-cids', id] as const,
  /** Busca no catálogo CID-10 (estático: pode ficar em cache à vontade). */
  cidBusca: (q: string) => ['cid', 'busca', q] as const,

  kanban: () => ['kanban'] as const,
  /** Catálogos da prorrogação (estáticos). */
  prorrogacaoCatalogos: () => ['prorrogacao', 'catalogos'] as const,

  auditoria: (userId: string, entidade: string, acao: string,
              de: string, ate: string, q: string, pagina: number, limite: number) =>
    ['auditoria', userId, entidade, acao, de, ate, q, pagina, limite] as const,
  auditoriaOpcoes: () => ['auditoria-opcoes'] as const,
  auditoriaResumo: (de: string) => ['auditoria-resumo', de] as const,

  /** Ajustes manuais do avanço dos módulos (tela Progresso). */
  progresso: () => ['progresso'] as const,

  /** Carga de trabalho por hospital (tela Volumetria, coordenadores). */
  volumetria: () => ['volumetria'] as const,

  /** Chamados ao suporte: a lista, uma conversa e a contagem do aviso no menu. */
  chamados: () => ['chamados', 'lista'] as const,
  chamado: (id: number) => ['chamados', 'conversa', id] as const,
  chamadosNaoLidos: () => ['chamados', 'nao-lidos'] as const,
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
  hospital: ['hospital'] as const,
  equipe: ['equipe'] as const,
  usuarios: ['usuarios'] as const,
  kanban: ['kanban'] as const,
  auditoria: ['auditoria'] as const,
  auditoriaResumo: ['auditoria-resumo'] as const,
  progresso: ['progresso'] as const,
  volumetria: ['volumetria'] as const,
  chamados: ['chamados'] as const,
} as const

export type QueryRoot = keyof typeof queryRoots
