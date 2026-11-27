// Fábrica única de chaves de cache do React Query.
//
// Antes, cada tela montava sua queryKey inline (['dashboard', op, ...],
// ['sidebar'], ...). Strings soltas espalhadas causam divergência (uma tela usa
// 'sidebar', outra digita errado) e tornam a invalidação frágil. Aqui cada
// domínio tem UMA função que produz sua chave — a fonte de verdade. `as const`
// preserva os literais para o TypeScript casar chaves na invalidação.

export const queryKeys = {
  // `escopo` e `limite` no fim: '' (a área) e 0 (a lista inteira) são o padrão;
  // a rede inteira e cada tamanho de janela viram outra entrada de cache.
  dashboard: (operadora: string, filtro: string, hospital: string, escopo = '', limite = 0) =>
    ['dashboard', operadora, filtro, hospital, escopo, limite] as const,

  dashboardOverview: (escopo = '') => ['dashboard-overview', escopo] as const,

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

  /** Pacientes da operadora em um hospital, na exclusão da operadora. */
  pacientesDaOperadora: (operadora: string, hospital: string) =>
    ['operadora-pacientes', operadora, hospital] as const,

  usuarios: () => ['usuarios'] as const,

  internacaoDados: (id: number) => ['internacao-dados', id] as const,
  internacaoTimeline: (id: number) => ['internacao-timeline', id] as const,
  sugestoesPessoa: (id: number) => ['sugestoes-pessoa', id] as const,
  internacaoRelatorios: (id: number) => ['internacao-relatorios', id] as const,
  /** CIDs vinculados ao paciente (card "CID" da ficha). */
  internacaoCids: (id: number) => ['internacao-cids', id] as const,
  /** Busca no catálogo CID-10 (estático: pode ficar em cache à vontade). */
  cidBusca: (q: string) => ['cid', 'busca', q] as const,
  tussBusca: (q: string) => ['tuss', 'busca', q] as const,

  kanban: () => ['kanban'] as const,
  /** Timeline do card de censo. Debaixo de ['kanban'] de propósito: toda
   *  invalidação do quadro (cobrar, atualizar, censo novo) a renova junto. */
  censoTimeline: (hospitalKey: string, operadoraKey: string) =>
    ['kanban', 'censo', hospitalKey, operadoraKey, 'timeline'] as const,
  /** Pedidos para desfazer a atualização de um censo (Distribuição de tarefas).
   *  Também debaixo de ['kanban']: o que move o card renova a lista. */
  pedidosDesfazerCenso: () => ['kanban', 'censo', 'pedidos-desfazer'] as const,
  /** Catálogos da prorrogação (estáticos). */
  prorrogacaoCatalogos: () => ['prorrogacao', 'catalogos'] as const,

  auditoria: (userId: string, entidade: string, acao: string,
              de: string, ate: string, q: string, pagina: number, limite: number) =>
    ['auditoria', userId, entidade, acao, de, ate, q, pagina, limite] as const,
  auditoriaOpcoes: () => ['auditoria-opcoes'] as const,
  auditoriaResumo: (de: string) => ['auditoria-resumo', de] as const,
  /** Tela Linha do tempo: o período e os filtros (área, operadora, quem, busca,
   *  coluna do ritmo) e quantas linhas a lista mostra. */
  linhaDoTempo: (periodo: string, area: string, operadora: string, quem: string,
                 q: string, balde: string, limite: number) =>
    ['linha-do-tempo', periodo, area, operadora, quem, q, balde, limite] as const,
  /** Envios de censo recentes com o estado de reversão de cada arquivo
   *  (Movimentações: o botão "Desfazer lote"). */
  enviosCenso: (limite: number) => ['envios-censo', limite] as const,
  /** Prévia do desfazer de um lote (`arquivo` = '*' para o envio inteiro). */
  previaReversao: (sessao: string, arquivo: string) => ['previa-reversao', sessao, arquivo] as const,

  /** Ajustes manuais do avanço dos módulos (tela Progresso). */
  progresso: () => ['progresso'] as const,
  /** Resumo detalhado das atividades (tela Progresso, grupo Em construção). */
  progressoAtividades: () => ['progresso-atividades'] as const,

  /** Carga de trabalho por hospital (tela Volumetria, coordenadores). */
  volumetria: () => ['volumetria'] as const,
  /** Aba "Acontecendo agora" da Distribuição. Debaixo de `volumetria`: um
   *  remanejo invalida o painel e a aba juntos, e a linha dele aparece na hora. */
  volumetriaAtividade: (filtros: { grupo?: string; usuario?: string; q?: string }) =>
    ['volumetria', 'atividade', filtros] as const,

  /** Pendências avulsas: as do usuário (aba Pendências de Tarefas), as de uma
   *  pessoa (Distribuição), quem pode recebê-las e as novas ainda não vistas
   *  (o aviso de toda tela). */
  pendencias: () => ['pendencias', 'minhas'] as const,
  pendenciasDaPessoa: (userId: string) => ['pendencias', 'pessoa', userId] as const,
  pendenciasEquipe: () => ['pendencias', 'equipe'] as const,
  pendenciasNovas: () => ['pendencias', 'novas'] as const,

  /** Chamados ao suporte: a lista, uma conversa e a contagem do aviso no menu. */
  chamados: () => ['chamados', 'lista'] as const,
  chamado: (id: number) => ['chamados', 'conversa', id] as const,
  chamadosNaoLidos: () => ['chamados', 'nao-lidos'] as const,

  /** Autorização para relatório fora da área (0061): a situação na ficha de um
   *  paciente, as listas da tela Aprovações e o contador do menu. */
  autorizacaoNaFicha: (internacaoId: number) => ['autorizacoes', 'ficha', internacaoId] as const,
  autorizacoes: (quais: string) => ['autorizacoes', 'lista', quais] as const,
  autorizacoesContagem: () => ['autorizacoes', 'contagem'] as const,

  /** Módulo 2 > Auditores: a lista com o resumo e a ficha de documentos de um. */
  auditores: () => ['auditores', 'lista'] as const,
  auditor: (id: number) => ['auditores', 'ficha', id] as const,

  /** Módulo 2 > Fechamentos: a agenda de fechamentos de um período. */
  fechamentos: (de: string, ate: string) => ['fechamentos', 'lista', de, ate] as const,

  /** Módulo 2 > Agenda de serviços: os postos de cada auditor e as opções para lançar. */
  postos: () => ['postos', 'lista'] as const,
  /** Na tela Auditores: os serviços de cada um (lista) e a agenda de um (ficha). */
  postosServicos: () => ['postos', 'servicos'] as const,
  postosDoAuditor: (id: number) => ['postos', 'auditor', id] as const,

  /** Módulo 2 > Ausências: os pedidos de ausência dos auditores. */
  ausencias: () => ['ausencias', 'lista'] as const,
  /** Módulo 2 > Auditores > ficha: cadastro e contrato (fica sob a raiz de auditores). */
  auditorCadastro: (id: number) => ['auditores', 'cadastro', id] as const,

  /** Ficha do hospital: contatos por área, censo e avisos do App (0068). */
  hospitalContatos: (key: string) => ['hospital-contatos', 'ficha', key] as const,
  /** Avisos de mudança de contato vindos do App, ainda não tratados (todos os hospitais). */
  hospitalAvisos: () => ['hospital-contatos', 'avisos'] as const,
  /** Módulo 2 > Senhas: as senhas do dia cadastradas pela B+ (0070). */
  senhasPortal: () => ['senhas-portal', 'lista'] as const,
  /** Módulo 2 > Senhas > Contagem do mês (0071). */
  senhasContagem: (comp: string) => ['senhas-portal', 'contagem', comp] as const,
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
  enviosCenso: ['envios-censo'] as const,
  progresso: ['progresso'] as const,
  volumetria: ['volumetria'] as const,
  pendencias: ['pendencias'] as const,
  chamados: ['chamados'] as const,
  autorizacoes: ['autorizacoes'] as const,
  auditores: ['auditores'] as const,
  fechamentos: ['fechamentos'] as const,
  ausencias: ['ausencias'] as const,
  postos: ['postos'] as const,
  hospitalContatos: ['hospital-contatos'] as const,
  senhasPortal: ['senhas-portal'] as const,
} as const

export type QueryRoot = keyof typeof queryRoots
