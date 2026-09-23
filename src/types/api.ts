// Tipos espelhando o JSON retornado pela API FastAPI.

export interface Operadora {
  key: string
  nome: string
  ativo?: boolean
}

/** Operadora vinculada a um hospital (vinculo N-N). */
export interface OperadoraVinculo {
  key: string
  nome: string
}

/** Campos cadastrais da ficha do hospital (migration 0015). Todos opcionais. */
export interface HospitalFicha {
  telefone?: string | null
  email?: string | null
  cnpj?: string | null
  endereco?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  observacoes?: string | null
}

export interface Hospital extends HospitalFicha {
  key: string
  nome: string
  /** Operadora principal (legado 1:N). Preferir `operadoras`. */
  operadora_key?: string
  operadora_nome?: string | null
  /** Keys de TODAS as operadoras que o hospital atende. */
  operadoras?: string[]
  /** As mesmas, ja com nome amigavel para exibicao. */
  operadoras_nomes?: OperadoraVinculo[]
  regiao?: string | null
  internados: number
  urgente: number
  altas: number
}

export interface Internacao {
  id: number
  /**
   * Vazio nos censos que não têm coluna de paciente: o hospital identifica a
   * internação pela `senha` de autorização. Use `identificacaoPaciente()`
   * (lib/texto) para exibir — nunca `nome` cru.
   */
  nome: string | null
  /** Senha de autorização do convênio; identifica o paciente quando não há nome. */
  senha?: string | null
  atendimento?: string | null
  hospital_key?: string
  hospital_nome?: string
  tipo_leito?: string | null
  leito_codigo?: string | null
  especialidade?: string | null
  diagnostico?: string | null
  medico?: string | null
  idade?: string | null
  sexo?: string | null
  dias?: number | null
  dias_sem_relatorio?: number | null
  dias_ate_vencer?: number | null
  janela_relatorio?: number | null
  gatilho?: number | null
  data_entrada?: string | null
  /** Preenchida quando o paciente ja recebeu alta (lista do filtro "Altas"). */
  data_alta?: string | null
  data_ultima_visita?: string | null
  status?: string
  status_relatorio?: string
  status_rvm?: string
  longa_10?: boolean
  longa_30?: boolean
  // Limites reais de longa permanência (em dias), configurados por operadora.
  limite_longa?: number | null
  limite_avancada?: number | null
  // ── Visita agendada ───────────────────────────────────────────────────────
  // O compromisso do técnico de ir ver o paciente num dia. É o que separa a
  // coluna "Aguardando visita" da fila de "Sem relatório". Não é um status:
  // agendar não cumpre a obrigação de relatório.
  visita_agendada?: boolean | null
  /** Dia (ISO) da visita marcada. */
  visita_agendada_em?: string | null
  /** Quem marcou (e-mail do técnico). */
  visita_agendada_por?: string | null
  /** De QUEM é a visita (médico auditor). Diferente de quem marcou. */
  visita_agendada_medico?: string | null
  /** Horário da visita ("HH:MM"), migration 0035. Só exibição — nenhuma regra
   *  de vencimento ou ordenação depende dele, só a data. */
  visita_agendada_hora?: string | null
  /** Dias até a visita; negativo = o dia já passou. */
  dias_ate_visita?: number | null
  /** Passou do dia e a visita não foi registrada. */
  visita_agendada_vencida?: boolean | null
  alerta_relatorio?: boolean
  em_monitoramento?: boolean
  obs?: string | null
  // Etiqueta da operadora dona do hospital — preenchida na Visão Geral
  // consolidada (todas as operadoras), para a tabela dizer de quem é cada linha.
  operadora_key?: string
  operadora_nome?: string | null
}

/** Contagens por hospital dentro de `DashboardStats.por_hospital`.
 *  Espelha `_zero_hosp` em application/internacoes.py. */
export interface StatsPorHospital {
  key: string
  nome: string
  internados: number
  altas: number
  urgente: number
  sem_relatorio: number
  relatorio_vencido: number
  proximo_vencer: number
  relatorio_em_dia: number
  longa_10: number
  longa_30: number
  altas_sem_relatorio: number
  /** Presente só no consolidado (todas as operadoras). */
  operadora_key?: string
}

/** Stats agregados de uma operadora. Espelha `_STATS_ZERADO` +
 *  `dashboard_stats` em application/internacoes.py. */
export interface DashboardStats {
  hoje_efetivo?: string
  total_internados?: number
  sem_relatorio?: number
  relatorio_vencido?: number
  proximo_vencer?: number
  relatorio_em_dia?: number
  em_monitoramento?: number
  total_urgente?: number
  total_atencao?: number
  /** Permanência ≥ 10 e ≥ 30 dias (nomes do backend; não `longa_permanencia`). */
  longa_10?: number
  longa_30?: number
  altas_recentes?: number
  altas_sem_relatorio?: number
  alerta_relatorio?: number
  total_altas?: number
  por_hospital?: StatsPorHospital[]
}

export interface DashboardPayload {
  stats: DashboardStats
  internacoes: Internacao[]
  operadora: string
  op_nome: string
  hospitais: Hospital[]
  filtro_atual: string
  hospital_atual: string | null
  q: string
  // Operadora fora do escopo do usuário: payload zerado e sem nome. O front
  // volta à visão consolidada (ver Dashboard.tsx).
  sem_acesso?: boolean
  // Visão CONSOLIDADA (sem operadora): stats somados de todas as operadoras do
  // escopo; cada internação/hospital traz operadora_key/operadora_nome.
  todas?: boolean
}

// Panorama de TODAS as operadoras num disparo (stats + hospitais, SEM a lista
// pesada de internados). Alimenta os KPIs e o seletor de qualquer operadora.
export interface DashboardOverviewOperadora {
  operadora: string
  op_nome: string
  stats: DashboardStats
  hospitais: Hospital[]
}

export interface DashboardMedias {
  media_mes: MediaPeriodo
  media_semestre: MediaPeriodo
  media_ano: MediaPeriodo
}

export interface DashboardOverview {
  operadoras: Record<string, DashboardOverviewOperadora>
  lista: Array<{ key: string; nome: string }>
  hoje_efetivo: string
  medias?: DashboardMedias
}

/** Operadora no sidebar. Espelha `sidebar_data` em application/internacoes.py. */
export interface SidebarOp {
  key: string
  nome: string
  internados?: number
  urgente?: number
  alertas?: number
  /** Pacientes internados que ainda não têm nenhum relatório — os "novos".
   *  É o marcador da sidebar; `urgente` soma estes aos de relatório vencido. */
  novos?: number
}

export interface SidebarData {
  operadoras: Operadora[]
  sidebar_ops: SidebarOp[]
  hoje_efetivo: string
  sidebar_prof_count: number
}

// Papel de acesso do usuário (espelha a tabela `profiles` do backend).
export type UserRole =
  | 'admin' | 'diretor' | 'gestor' | 'administrativo' | 'tecnico'
  /** Analista interno: LÊ os dados operacionais e a trilha de Movimentações, sem escrever
   *  nada. Não vê Diretoria nem Gestor. */
  | 'analista'
  /** Coordenador administrativo: vê a Volumetria (cobranças de censo por hospital),
   *  sem recorte de escopo. Somente leitura. */
  | 'coordenador_administrativo'
  /** Coordenador técnico: vê a Volumetria (pacientes sem relatório/aguardando visita
   *  por hospital), sem recorte de escopo. Somente leitura. */
  | 'coordenador_tecnico'

// Payload de GET /api/volumetria (tela Volumetria, coordenadores).
// Centrado na PESSOA: quanto cada técnico/administrativo carrega em TEMPO
// estimado de análise (horas), contra a capacidade dela, e quais hospitais
// ninguém do grupo cobre. As regras vivem em domain/carga.py (backend).
export type VolumetriaNivel = 'normal' | 'atencao' | 'sobrecarga'

export interface VolumetriaLimiares {
  fila_atencao_dias: number
  fila_sobrecarga_dias: number
  pressao_atencao_pct: number
  pressao_sobrecarga_pct: number
}

/** Parâmetros EFETIVOS do grupo (padrões já mesclados com o que foi calibrado).
 *  Os de leito/fatores só existem no grupo técnico; `minutos_cobranca` só no
 *  administrativo. */
export interface VolumetriaParametros {
  minutos_leito?: { UTI: number; APARTAMENTO: number; ENFERMARIA: number }
  fator_longa_10?: number
  fator_longa_30?: number
  fator_reanalise?: number
  minutos_cobranca?: number
  capacidade_horas_dia: number
  /** user_id → horas/dia próprias (ausente = padrão do grupo). */
  capacidade_por_pessoa: Record<string, number>
  prazo_dias: number
  limiares: VolumetriaLimiares
}

/** Corpo do PUT parcial: chave de topo ausente = não mexeu; dentro dos
 *  sub-objetos, `null` REMOVE a entrada (volta ao padrão). */
export interface VolumetriaParametrosCorpo {
  minutos_leito?: Partial<Record<'UTI' | 'APARTAMENTO' | 'ENFERMARIA', number | null>>
  fator_longa_10?: number
  fator_longa_30?: number
  fator_reanalise?: number
  minutos_cobranca?: number
  capacidade_horas_dia?: number
  capacidade_por_pessoa?: Record<string, number | null>
  prazo_dias?: number
  limiares?: Partial<Record<keyof VolumetriaLimiares, number | null>>
}

export interface VolumetriaParametrosMeta {
  personalizado: boolean
  atualizado_por: string | null
  atualizado_em: string | null
}

/** Quebra das demandas com os MESMOS nomes das colunas de Tarefas (+ o que já
 *  venceu). Técnico: as quatro categorias (sem_relatorio, aguardando_visita,
 *  vencido, proximo_vencer) são exclusivas e somam a fila; `internados` é
 *  todo mundo sob responsabilidade. Administrativo: `sem_censo` (1 por
 *  hospital a cobrar) e `maior_atraso` em dias. */
export interface VolumetriaQuebra {
  internados?: number
  em_monitoramento?: number
  sem_relatorio?: number
  aguardando_visita?: number
  visitas_atrasadas?: number
  vencido?: number
  proximo_vencer?: number
  sem_censo?: number
  maior_atraso?: number
}

export interface VolumetriaHospitalDaPessoa {
  hospital_key: string
  hospital_nome: string
  operadora_key: string | null
  /** Casos na fila deste hospital. */
  pendencias: number
  /** Tempo estimado desses casos, em horas. */
  horas: number
  /** Internados ativos (só no grupo técnico). */
  internados?: number | null
  /** Só no grupo administrativo: há quantos dias o hospital está sem censo. */
  dias_sem_censo?: number | null
  quebra: VolumetriaQuebra
  /** Quantas OUTRAS pessoas do grupo também cobrem este hospital. */
  compartilhado_com: number
  /** Região do cadastro do hospital; "Sem região" quando em branco. */
  regiao: string
}

/** Uma região coberta por uma pessoa: a parte DELA naquela região. */
export interface VolumetriaRegiaoDaPessoa {
  regiao: string
  hospitais: number
  /** Internados nos hospitais dela naquela região. 0 no administrativo. */
  pacientes: number
  pendencias: number
  horas: number
}

/** Uma região do grupo e quem responde por ela. Hospital compartilhado conta
 *  uma vez nos totais, e todas as pessoas que o cobrem entram em `responsaveis`. */
export interface VolumetriaRegiaoDoGrupo {
  regiao: string
  responsaveis: Array<{ user_id: string; nome: string }>
  hospitais: number
  pacientes: number
  pendencias: number
  horas: number
}

export interface VolumetriaPessoa {
  user_id: string
  /** Nome cadastrado no perfil; sem ele, um legível derivado do e-mail. */
  nome: string
  /** True quando `nome` foi derivado do e-mail (perfil sem nome cadastrado). */
  sem_nome: boolean
  email: string
  /** Sem hospital vinculado: vê a rede inteira. Para o coordenador é "área não
   *  definida", não "carrega tudo" — fica fora do gráfico e os indicadores
   *  abaixo vêm null. */
  sem_vinculo: boolean
  /** Casos na fila (contagem). */
  total_pendencias: number | null
  /** Tempo estimado da fila, em horas. */
  horas: number | null
  /** horas ÷ capacidade diária: quantos dias para zerar a fila. */
  dias_fila: number | null
  /** Só no grupo técnico: % da capacidade dos próximos `prazo_dias` que os
   *  casos vencendo nesse prazo consomem. null no administrativo. */
  pressao_pct: number | null
  nivel: VolumetriaNivel | null
  capacidade_horas_dia: number
  /** True quando a capacidade veio de `capacidade_por_pessoa`, não do grupo. */
  capacidade_propria: boolean
  /** Ordenado por horas desc. Vazio quando `sem_vinculo`. */
  hospitais: VolumetriaHospitalDaPessoa[]
  /** Quantos hospitais a pessoa herdou em Operações. */
  hospitais_n: number
  /** Soma das quebras dos hospitais dela. null quando `sem_vinculo`. */
  quebra: VolumetriaQuebra | null
  /** Internados sob responsabilidade (técnico). null no administrativo/sem vínculo. */
  pacientes: number | null
  /** Regiões que a pessoa cobre, derivadas dos hospitais dela. */
  regioes: VolumetriaRegiaoDaPessoa[]
}

export interface VolumetriaHospitalSemCobertura {
  hospital_key: string
  hospital_nome: string
  operadora_key: string | null
  pendencias: number
  horas: number
  internados?: number | null
  /** Só no grupo administrativo: há quantos dias o hospital está sem censo. */
  dias_sem_censo?: number | null
  quebra: VolumetriaQuebra
}

// Um grupo (técnico OU administrativo). `papel` identifica o grupo
// ('coordenador_tecnico' | 'coordenador_administrativo'), não quem está logado.
export interface VolumetriaGrupo {
  papel: UserRole
  role_operacional: 'tecnico' | 'administrativo'
  total_pendencias: number
  total_horas: number
  /** Internados ativos na rede (técnico). null no administrativo. */
  total_pacientes: number | null
  /** Quebra total da rede, para os KPIs. */
  quebra: VolumetriaQuebra
  /** Sobrecarga → atenção → normal (fila desc dentro do nível); os `sem_vinculo` no fim. */
  pessoas: VolumetriaPessoa[]
  /** Pendência > 0 e nenhum vínculo explícito no grupo. Ordenado por horas desc. */
  sem_cobertura: VolumetriaHospitalSemCobertura[]
  /** Quem responde por cada região, com o peso da região. */
  regioes: VolumetriaRegiaoDoGrupo[]
  parametros: VolumetriaParametros
  parametros_meta: VolumetriaParametrosMeta
}

export interface VolumetriaPayload {
  /** Papel de quem pediu o payload. */
  papel: UserRole
  /** 1 grupo (cada coordenador) ou 2 (admin vê os dois, para supervisão). */
  grupos: VolumetriaGrupo[]
  filtros: GestorFiltros
}

// Resposta de POST /api/login (e de POST /api/sessao/renovar). `refresh_token`
// só vem no modo Supabase; `expires_in` (s) é a validade do token de acesso.
export interface LoginResponse {
  token: string
  refresh_token?: string | null
  username: string
  expires_in: number | null
}

// Resposta de POST /api/register. Quando o projeto exige confirmação de e-mail,
// vem apenas { confirmacao_necessaria: true, email }; caso contrário já traz a sessão.
// `role` ecoa o papel escolhido no cadastro.
export interface RegisterResponse {
  confirmacao_necessaria: boolean
  email?: string
  role?: UserRole
  token?: string
  refresh_token?: string
  username?: string
  expires_in?: number
}

// Resposta de GET /api/me (identidade + papel resolvido do profile).
export interface MeResponse {
  username: string
  role: UserRole | null
  /** Nome de exibição: o cadastrado no perfil, senão derivado do e-mail. */
  nome?: string | null
}

// ── Gestão de usuários de acesso (contas de login) ──────────────────────────
export interface Usuario {
  user_id: string
  email: string | null
  /** Nome de exibição (opcional; contas antigas podem não ter). */
  nome?: string | null
  role: UserRole
  criado_em?: string
  /** false = conta SUSPENSA pelo analista (403 em toda a API, sem apagar).
   *  Ausente/true = ativa. */
  ativo?: boolean
  /** Keys dos hospitais associados. Vazio = sem restrição (vê todos). */
  hospitais?: string[]
}

export interface UsuariosPayload {
  usuarios: Usuario[]
}

// ── Auditoria / Movimentações (GET /api/auditoria*) ────────────────────────
// Um registro por ação feita na plataforma: quem (snapshot do usuário no
// momento), o quê (ação/entidade/alvo), quando e o resultado HTTP.

/** Família da ação. Espelha ENTIDADES do backend (application/auditoria.py). */
export type AuditEntidade =
  | 'relatorio' | 'paciente' | 'censo' | 'hospital' | 'operadora' | 'profissional'
  | 'escala' | 'usuario' | 'sessao' | 'kanban' | 'sistema' | 'outro'

export interface AuditLog {
  id: number
  /** Timestamp ISO (timestamptz do banco). */
  criado_em: string
  user_id?: string | null
  user_email?: string | null
  user_nome?: string | null
  user_role?: UserRole | string | null
  /** "entidade.verbo", ex.: relatorio.registrar. */
  acao: string
  entidade: AuditEntidade | string
  /** Id/chave do alvo (relatório, sessão de upload, key do hospital…). */
  entidade_id?: string | null
  /** Frase humana já montada pelo backend. */
  resumo: string
  /** Contexto de negócio livre (paciente, arquivos, campos alterados…). */
  detalhes?: Record<string, unknown> | null
  metodo?: string | null
  rota?: string | null
  status?: number | null
  resultado: 'ok' | 'erro'
  ip?: string | null
}

export interface AuditoriaPayload {
  itens: AuditLog[]
  total: number
  pagina: number
  limite: number
}

export interface AuditoriaOpcoes {
  entidades: Array<{ key: string; label: string }>
  acoes: Array<{ key: string; label: string; entidade: string }>
}

export interface AuditoriaTotais {
  acoes: number
  ok: number
  erros: number
  /** Tentativas barradas por permissão (403). */
  negados: number
  hoje: number
  por_entidade: Record<string, number>
}

/** Conta de acesso + sua atividade no período. `existe=false` = a conta foi
 *  apagada mas a trilha dela permanece. */
export interface AuditoriaUsuario extends Omit<Usuario, 'role'> {
  role: UserRole | string | null
  existe: boolean
  total: number
  ok: number
  erros: number
  por_entidade: Record<string, number>
  ultimo_em?: string | null
  ultimo_resumo?: string | null
}

export interface AuditoriaResumo {
  de: string
  totais: AuditoriaTotais
  usuarios: AuditoriaUsuario[]
}

// ── Configurações (GET /api/configuracoes) ──────────────────────────────────
export interface OperadoraRegras {
  dias_uti: number
  dias_apartamento: number
  dias_enfermaria: number
  dias_entre_relatorios: number
  alerta_antecipado_dias: number
  dias_longa_permanencia: number
  dias_longa_avancada: number
  usar_longa_permanencia?: boolean
  fallback_sem_leito: string
  responsaveis?: string
  ativo: boolean
}

export interface OperadoraCard {
  key: string
  nome: string
  internados: number
  urgente: number
  em_dia: number
  em_monitoramento: number
  sla: number
  regras: Partial<OperadoraRegras>
  responsaveis?: string
  hospitais_count: number
}

export interface OperadoraStats {
  total_internados: number
  sem_relatorio: number
  relatorio_vencido: number
  relatorio_em_dia: number
  em_monitoramento: number
  sla: number
}

export interface OperadoraHospital {
  key: string
  nome: string
  internados?: number
  urgente?: number
  operadora_key?: string
}

export interface OperadoraSelected {
  key: string
  nome: string
  regras: OperadoraRegras
  responsaveis?: string
  ativo: boolean
  stats: OperadoraStats
  hospitais: OperadoraHospital[]
}

export interface HospitalInternacao {
  nome?: string
  atendimento?: string | null
  leito?: string | null
  dias?: number
  status_relatorio?: string
}

export interface HospitalSelected extends HospitalFicha {
  key: string
  nome: string
  regiao?: string | null
  operadora_key?: string
  operadoras?: string[]
  operadoras_nomes?: OperadoraVinculo[]
  internados: number
  escala: Escala[]
  internacoes: HospitalInternacao[]
}

export interface ConfiguracoesPayload {
  operadoras: OperadoraCard[]
  op_selected: OperadoraSelected | null
  hospital_selected: HospitalSelected | null
  profs_ativos: Profissional[]
  view: 'overview' | 'edit' | 'hospital'
}

// ── Equipe (GET /api/equipe) ────────────────────────────────────────────────
export type ProfTipo = 'E' | 'M' | 'O'

export interface Profissional {
  id: number
  nome: string
  tipo: ProfTipo
  ativo: boolean | number
  criado_em?: string
}

export interface Escala {
  id: number
  hospital_key?: string
  hospital_nome: string
  operadora_key: string
  servico: string
  profissional_id: number
  profissional_nome?: string
  profissional_tipo?: ProfTipo
}

export interface EquipePayload {
  enfermeiros: Profissional[]
  medicos: Profissional[]
  operadores: Profissional[]
  total_prof: number
  total_todos: number
  ops_lista: Array<{ key: string; nome: string }>
}

export interface ProfissionalDetalhe {
  profissional: Profissional
  escala: Escala[]
}

/** Resposta do POST /api/profissionais. */
export interface ProfissionalCriado {
  ok: boolean
  id: number
  /** Já havia profissional com este nome: veio o id dele, sem duplicar. */
  existing?: boolean
  /** Só quando o cadastro trouxe escala: quantos hospitais entraram... */
  escala_adicionada?: number
  /** ...e quais não entraram (não há transação, o resto fica gravado). */
  escala_falhas?: Array<{ hospital_nome: string; operadora_key: string; servico: string; erro: string }>
}

// ── Gestor / Fluxo (GET /api/gestor) ────────────────────────────────────────
export interface DiaMetricas {
  internados: number
  f0_9: number
  f10_29: number
  f30: number
  entradas: number
  altas: number
}

export interface SerieDia extends DiaMetricas {
  dia: string      // ISO — fim do bucket
  ini: string      // ISO — 1º dia do bucket (limite do clique-no-período)
  fim: string      // ISO — último dia do bucket
  label: string    // dd/mm (dia/semana) ou mmm/aa (mês, nas janelas 6m/1a)
}

export interface MediaPeriodo {
  internados_media: number
  altas_total: number
  entradas_total: number
  altas_dia: number
}

export interface GestorGrupo {
  key: string
  nome: string
  internados: number
  altas: number
  /** Só em `por_operadora`: hospitais DISTINTOS da operadora com movimento no
   *  período. Ausente nos demais agrupamentos (por hospital, por região). */
  hospitais?: number
}

export interface PacienteDia {
  id: number
  /**
   * Vazio nos censos que não têm coluna de paciente: o hospital identifica a
   * internação pela `senha` de autorização. Use `identificacaoPaciente()`
   * (lib/texto) para exibir — nunca `nome` cru.
   */
  nome: string | null
  /** Senha de autorização do convênio; identifica o paciente quando não há nome. */
  senha?: string | null
  atendimento?: string | null
  hospital_key?: string
  hospital_nome?: string
  operadora_key: string
  operadora_nome?: string
  regiao?: string | null
  tipo_leito?: string | null
  dias: number
  faixa: '0_9' | '10_29' | '30p'
  situacao: 'ALTA' | 'INTERNADO'
  data_entrada?: string
}

export interface GestorMetrics {
  dia: string
  dia_label: string
  /** Limites do período analisado. No modo dia/geral ambos = `dia`; no modo
   *  intervalo, o 1º e o último dia do bucket clicado. */
  dia_inicio: string
  dia_fim: string
  /** True quando o painel está ancorado num intervalo (clique numa coluna). */
  modo_intervalo: boolean
  hoje: DiaMetricas
  serie_30d: SerieDia[]
  media_mes: MediaPeriodo
  media_semestre: MediaPeriodo
  media_ano: MediaPeriodo
  /** Média do período da janela do gráfico (acompanha 30d/90d/6m/1a). */
  media_janela: MediaPeriodo
  media_janela_dias: number
  por_operadora: GestorGrupo[]
  por_hospital: GestorGrupo[]
  por_regiao: GestorGrupo[]
  pacientes_dia: PacienteDia[]
}

export interface GestorFiltros {
  operadoras: Array<{ key: string; nome: string }>
  hospitais: Array<{ key: string; nome: string; operadora_key?: string }>
  regioes: string[]
}

// GET /api/gestor devolve métricas e filtros juntos, num único payload aninhado.
export interface GestorResposta {
  metrics: GestorMetrics
  filtros: GestorFiltros
}

// ── Kanban de tarefas do analista ─────────────────────────────────────────────
// Quadro por TIPO/categoria (não por progresso). Cada coluna tem sua fonte:
// pacientes sem relatório (derivados de status_relatorio, sempre atuais),
// cobranças de censo e análise técnica.
// A coluna "Analisar censo" saiu: a revisão da extração passou a acontecer na
// própria tela de upload, onde o usuário completa ou descarta cada registro.

/** Coluna do kanban = categoria de tarefa. */
export type KanbanColuna = 'sem_relatorio' | 'aguardando_visita' | 'visitas_atrasadas' | 'cobrancas'

/** Relatório do auditor externo a analisar (card da coluna analise_tecnica). */
export interface RelatorioExterno {
  relatorio_id?: number | null
  data_visita?: string | null
  medico?: string | null
  descricao?: string | null
  autor?: string | null
  tem_arquivo?: boolean
}

/** Um card de tarefa. `internacao_id` presente → abre o drawer do paciente. */
export interface KanbanTarefa {
  /** id da tarefa na sua fonte (pendência ou internação); estável p/ key React. */
  id: number | string
  coluna: KanbanColuna
  titulo: string                 // nome do paciente ou identificação da linha
  hospital_key?: string | null
  hospital_nome?: string | null
  /** Operadora do hospital — colore o avatar do card. */
  operadora_key?: string | null
  atendimento?: string | null
  /** Internação associada (colunas sem_relatorio/vencidos, e pendência já casada). */
  internacao_id?: number | null
  /** Dias sem relatório (sem_relatorio/vencidos), para priorização. */
  dias_sem_relatorio?: number | null
  /** Cobrança de censo (coluna cobrancas) — habilita "marcar cobrado". */
  cobranca_id?: number | null
  /** Dia cujo censo faltou (YYYY-MM-DD). */
  data_ref?: string | null
  /** Dia (ISO) a que o último censo do hospital SE REFERE, não o dia do upload
   *  (null = nunca enviou). Quem sobe hoje o censo de uma semana atrás não cobriu
   *  o dia de hoje, e é esta data que o card conta. */
  ultimo_censo?: string | null
  /** Há quantos dias foi o último censo, contado por `ultimo_censo`. */
  dias_sem_censo?: number | null
  /** false = o relatório não declarou a data e `ultimo_censo` é o dia do upload.
   *  Não aparece na tela; serve a quem for investigar uma data suspeita. */
  data_declarada?: boolean | null
  /** Análise técnica (coluna analise_tecnica) — habilita concluir o parecer. */
  analise_id?: number | null
  // ── Contexto clínico (cards de paciente) ──────────────────────────────────
  // Alimentam as linhas de detalhe do card e os filtros de prioridade da tela
  // (UTI, longa permanência, sem leito…), que rodam no cliente sobre o payload
  // já carregado — sem ida extra ao servidor a cada clique em chip.
  /** Senha de autorização; identifica o paciente nos censos sem coluna de nome. */
  senha?: string | null
  carteirinha?: string | null
  tipo_leito?: string | null
  leito_codigo?: string | null
  especialidade?: string | null
  medico?: string | null
  convenio?: string | null
  idade?: string | null
  sexo?: string | null
  data_entrada?: string | null
  data_ultima_visita?: string | null
  /** Dias internado (≠ dias_sem_relatorio). */
  dias?: number | null
  /** Janela de relatório da operadora; usada pelo chip "Urgentes". */
  janela_relatorio?: number | null
  status_relatorio?: string | null
  em_monitoramento?: boolean | null
  longa_10?: boolean | null
  longa_30?: boolean | null
  limite_longa?: number | null
  limite_avancada?: number | null
  // ── Visita agendada ───────────────────────────────────────────────────────
  // O compromisso do técnico de ir ver o paciente num dia. É o que separa a
  // coluna "Aguardando visita" da fila de "Sem relatório". Não é um status:
  // agendar não cumpre a obrigação de relatório.
  visita_agendada?: boolean | null
  /** Dia (ISO) da visita marcada. */
  visita_agendada_em?: string | null
  /** Quem marcou (e-mail do técnico). */
  visita_agendada_por?: string | null
  /** De QUEM é a visita (médico auditor). Diferente de quem marcou. */
  visita_agendada_medico?: string | null
  /** Horário da visita ("HH:MM"), migration 0035. Só exibição — nenhuma regra
   *  de vencimento ou ordenação depende dele, só a data. */
  visita_agendada_hora?: string | null
  /** Dias até a visita; negativo = o dia já passou. */
  dias_ate_visita?: number | null
  /** Passou do dia e a visita não foi registrada. */
  visita_agendada_vencida?: boolean | null
  /** Relatório do auditor externo que o técnico vai analisar. */
  relatorio_externo?: RelatorioExterno
}

/** Colunas de tarefas. O board do técnico traz só `analise_tecnica`; o do
 *  administrativo, as operacionais. Todas opcionais para cobrir os dois papéis. */
export interface KanbanColunas {
  sem_relatorio?: KanbanTarefa[]
  aguardando_visita?: KanbanTarefa[]
  visitas_atrasadas?: KanbanTarefa[]
  cobrancas?: KanbanTarefa[]
}

/** Payload do GET /api/kanban — tarefas + opções de filtro (recortadas ao escopo).
 *  `filtros` reusa o mesmo formato do Gestor (operadoras/hospitais do escopo). */
export interface KanbanPayload {
  /** Qual board o backend montou: 'tecnico' (só análise técnica), 'administrativo'
   *  (2 operacionais) ou 'admin' (quadro completo: operacionais + análise técnica). */
  papel?: 'tecnico' | 'administrativo' | 'admin'
  tarefas: KanbanColunas
  filtros: GestorFiltros
}

/** Corpo de POST /api/kanban/analise/{id}/concluir — o parecer do técnico interno. */
export interface ConcluirAnalisePayload {
  comentario?: string | null
  veredito: 'APROVADO' | 'REJEITADO'
}

// ── Diretoria (GET /api/diretoria) ──────────────────────────────────────────
export interface DiretoriaOperadora {
  key: string
  nome: string
  responsaveis?: string
  janela_relatorio?: number | null
  internados: number
  em_monitoramento: number
  sem_relatorio: number
  relatorio_vencido: number
  proximo_vencer: number
  relatorio_em_dia: number
  longa_permanencia: number
  longa_avancada: number
  total_altas: number
  sla: number
  /** Hospitais vinculados à operadora no cadastro (rede), já recortados ao escopo
   *  do usuário. A base cresce sozinha pelos censos: um censo com pacientes de um
   *  convênio prova que aquele hospital atende aquela operadora. */
  hospitais?: number
  /** Destes, quantos tiveram movimento — hospital parado continua na rede. */
  hospitais_ativos?: number
}

export interface TopHospital {
  hospital_nome: string
  operadora_key?: string
  internados: number
}

export interface DiretoriaPayload {
  hoje_efetivo?: string
  sla_global: number
  total_alertas: number
  total_internados: number
  sem_relatorio: number
  relatorio_vencido: number
  proximo_vencer: number
  relatorio_em_dia: number
  em_monitoramento: number
  longa_permanencia: number
  longa_avancada: number
  total_altas: number
  relatorios_7d: number
  relatorios_30d: number
  total_relatorios: number
  por_operadora: DiretoriaOperadora[]
  trend_semanal: number[]
  trend_labels: string[]
  top_hospitais: TopHospital[]
}

// ── Upload de censos (POST /api/upload/stage → /api/upload/processar) ───────
// O parser extrai os pacientes; os válidos entram no banco. Os que não validaram
// voltam em `pendentes_detalhe` (já persistidos como pendência do Kanban) para o
// usuário completar na hora via POST /api/upload/pendencia/{id}/completar.

/** Campo da ficha que o parser não capturou (ou capturou inválido) e a tela pede. */
export type CampoCenso = 'atendimento' | 'nome' | 'data_entrada' | 'data_alta'

/** Paciente extraído do censo que NÃO passou na validação. */
export interface PendenteCenso {
  /** Id da pendência persistida (null só se o backend não devolveu o id). */
  pendencia_id: number | null
  arquivo?: string
  hospital_key?: string | null
  hospital_nome?: string | null
  /** Frases do validador (contexto para o usuário). */
  motivos: string[]
  /** Campos que o usuário precisa informar/corrigir para gravar. */
  campos_faltantes: CampoCenso[]
  // Ficha extraída — os 4 primeiros são editáveis; o resto é contexto.
  atendimento?: string | null
  nome?: string | null
  data_entrada?: string | null
  data_alta?: string | null
  situacao?: string | null
  data_nascimento?: string | null
  setor?: string | null
  leito_codigo?: string | null
  tipo_leito?: string | null
  especialidade?: string | null
  medico?: string | null
  convenio?: string | null
  categoria?: string | null
}

/** Um paciente gravado por um arquivo do censo (conferência na tela de upload). */
/** O que há de errado com um paciente da lista de conferência. */
export interface ProblemaPaciente {
  /** `convenio_nao_reconhecido` | `outra_operadora` | `sem_convenio`. */
  tipo: string
  /** Frase pronta para ler — a tela não remonta texto de domínio. */
  texto: string
}

export interface PacienteGravado {
  /** O que há de errado com ESTE paciente (ausente = nada). Marcado na linha
   *  para o usuário achar QUEM tem o problema, não só quantos são. */
  problema?: ProblemaPaciente | null
  /** Corrigido na modal de edição, só nesta tela: a operadora escolhida resolveu
   *  o alerta da linha. Não vem do backend — existe para o aviso derivado (que é
   *  remontado a cada render a partir das listas do arquivo) não ressuscitar um
   *  problema que o usuário acabou de resolver. */
  resolvido?: boolean
  /** Id da internação gravada — é o que permite editar o paciente direto da
   *  lista de conferência do envio. Ausente em resultados de envios antigos,
   *  processados antes de o backend devolver o id: a linha existe, o lápis não. */
  id?: number | null
  nome?: string | null
  /** Identificação do paciente nos censos sem coluna de nome (ver `nome`). */
  senha?: string | null
  atendimento?: string | null
  /** Número do paciente na operadora, lido do censo. É o que se leva para a
   *  operadora ao autorizar uma diária, e o campo que mais sofre com erro de
   *  leitura (dígitos longos, impressos quebrados em duas linhas). */
  carteirinha?: string | null
  situacao: 'INTERNADO' | 'ALTA'
  leito_codigo?: string | null
  /** Convênio lido do próprio censo — o mesmo hospital atende várias operadoras. */
  convenio?: string | null
  /** Operadora sob a qual o paciente foi GRAVADO (key do cadastro), que pode não
   *  ser a escolhida no envio. É o que a correção de convênio ajusta, e o que
   *  define as regras de avaliação do paciente. */
  operadora_key?: string | null
  data_entrada?: string | null
  data_alta?: string | null
}

/** Um paciente que o censo tentou mover de seguradora. */
export interface ConflitoOperadora {
  atendimento?: string | null
  nome?: string | null
  /** Onde o paciente ESTÁ (e continuou). */
  operadora_atual: string
  /** O que o censo trouxe e foi recusado. */
  operadora_do_censo: string
  convenio_atual?: string | null
  convenio_do_censo?: string | null
}

export interface UploadCensoResult {
  arquivo: string
  /** O censo que este arquivo gerou (`censos.id`). É por ele que a lista remove
   *  um paciente DESTE documento sem apagar a ficha de quem já existia antes. */
  censo_id?: number
  hospital?: string
  hospital_nome?: string
  tipo?: string
  /** Pacientes válidos gravados. */
  total?: number
  /** Pacientes que este envio CRIOU (o desfazer remove exatamente estes). */
  criados?: number
  /** Atendimentos que JÁ existiam e foram atualizados — o desfazer NÃO os remove. */
  atualizados?: string[]
  /** Quebra de `total` por situação. Os censos desta safra são MISTOS (o mesmo PDF
   *  traz internados e as altas do dia) e a classificação é por paciente: quem tem
   *  data_alta vira ALTA. Mostrar a quebra evita a leitura de que um arquivo de
   *  altas teria cadastrado gente em leito. */
  altas?: number
  internados?: number
  /** Quem entrou, nominalmente — a tela lista para conferência na hora. */
  gravados_detalhe?: PacienteGravado[]
  /** Telemetria do parser: divergência entre linhas extraídas e o total impresso no PDF. */
  avisos?: string[]
  pendentes?: number
  pendentes_detalhe?: PendenteCenso[]
  /** O layout foi lido, mas o hospital não está no cadastro: nada foi gravado.
   *  A tela pede o hospital e reprocessa o arquivo (mesma sessão). */
  precisa_hospital?: boolean
  /** Nome do hospital lido do PDF — sugestão para cadastrar/casar. */
  hospital_sugerido?: string | null
  /** Operadora lida do PDF: key do cadastro, ou null quando nenhuma casou
   *  (nunca uma key inventada — a tela pede a escolha ao usuário). */
  operadora?: string | null
  operadora_nome?: string | null
  /** Pacientes que o parser extraiu e ficaram aguardando o hospital. */
  pacientes_extraidos?: number
  /** Dia a que o censo se refere (ISO `AAAA-MM-DD`), lido do cabeçalho do próprio
   *  relatório. `null` quando o arquivo não declara — a tela então não mostra
   *  data, em vez de exibir um palpite. */
  data_censo?: string | null
  /** Pacientes que o censo trouxe mas que JÁ tinham alta e não foram alterados:
   *  a entrada do censo não é posterior à alta registrada, então é a mesma
   *  internação que já terminou. Não é erro — é o censo repetindo quem já saiu. */
  mantidos_com_alta?: MantidoComAlta[]
  /** Pacientes que este censo tentou mover de uma operadora para OUTRA e que
   *  não foram movidos: a internação ficou na operadora que já tinha.
   *
   *  Exige decisão humana porque o sistema não sabe qual lado está errado — o
   *  convênio impresso no PDF, ou o cadastro anterior do paciente. Trocar
   *  sozinho seria mudar a seguradora de alguém em silêncio, e é da operadora
   *  que saem as regras de avaliação e a apuração da cobrança. */
  conflitos_operadora?: ConflitoOperadora[]
  /** Operadora escolhida por quem enviou (passo 1 da tela). É o padrão para quem
   *  não tem convênio reconhecido — não é a operadora de todo mundo do arquivo. */
  operadora_escolhida?: string | null
  /** Dupla checagem do envio: pacientes que entraram sob operadora DIFERENTE da
   *  escolhida, porque o convênio deles é de outra. Um censo é do hospital e pode
   *  ser misto, então isto é normal — mas precisa ser dito, senão o envio diverge
   *  em silêncio do que o usuário pediu. Vazio = tudo entrou como escolhido. */
  operadoras_divergentes?: OperadoraDivergente[]
  /** Pacientes com convênio impresso que NÃO casou com nenhuma operadora do
   *  cadastro: entraram sob a escolhida. Sinal de cadastro incompleto. */
  convenios_nao_reconhecidos?: PacienteConvenio[]
  /** Pacientes que entraram SEM convênio nenhum no PDF. A linha deles já era
   *  marcada na lista; sem esta lista o painel não tinha o que dizer sobre a
   *  marca, e o usuário via o alerta na linha sem achar a explicação. */
  sem_convenio?: PacienteConvenio[]
  erro?: string
  /** Por que o arquivo não foi lido, quando há `erro`:
   *  - `imagem`: PDF digitalizado/escaneado, sem texto. Não há o que ler; os
   *    pacientes deste censo precisam ser cadastrados à mão.
   *  - `formato_desconhecido`: tem texto, mas o layout não é reconhecido — caso
   *    de avisar o suporte para incluir o modelo. */
  erro_tipo?: 'imagem' | 'formato_desconhecido' | null
}

/** O mínimo para reconhecer um paciente na conferência do envio. */
export interface PacienteConvenio {
  nome?: string | null
  atendimento?: string | null
  /** Convênio como está impresso no censo — é por ele que se reconhece o caso. */
  convenio?: string | null
}

/** Um grupo de pacientes que entrou sob operadora diferente da escolhida. */
export interface OperadoraDivergente {
  operadora_key: string
  operadora_nome?: string
  /** Quantos pacientes — pode ser maior que `pacientes.length`, que é amostra. */
  total: number
  /** Alguns nomes, para reconhecer o caso sem despejar o censo inteiro. */
  pacientes: PacienteConvenio[]
  /** Os atendimentos de TODOS (não só dos exibidos). É o que permite descontar
   *  do total quem foi corrigido ou removido nesta tela: com só a amostra,
   *  remover alguém fora dos 5 primeiros deixava o alerta com a contagem antiga. */
  atendimentos?: string[]
}

/** Um arquivo de censo dentro de um dia da timeline do hospital. */
export interface CensoArquivo {
  censo_id: number
  arquivo?: string | null
  tipo?: string | null
  /** Quando o arquivo foi enviado — diferente do dia a que o censo se refere. */
  processado_em?: string | null
  /** Preenchido quando o envio foi desfeito; o registro continua na timeline. */
  revertido_em?: string | null
  total_pacientes: number
}

/** Um paciente que apareceu num censo. */
export interface CensoPaciente {
  id: number
  nome?: string | null
  senha?: string | null
  atendimento?: string | null
  leito_codigo?: string | null
  convenio?: string | null
  data_entrada?: string | null
  data_alta?: string | null
  status?: string | null
  /** "novo" = este censo criou a internação; "atualizado" = já existia. */
  origem?: string
}

/** Um dia da timeline: os censos daquele dia e quem veio neles. */
export interface CensoDia {
  /** Data de REFERÊNCIA do censo (ISO). `null` quando o relatório não declara. */
  data: string | null
  arquivos: CensoArquivo[]
  pacientes: CensoPaciente[]
  /** Pessoas distintas no dia (o mesmo paciente pode estar em dois arquivos). */
  total_pacientes: number
  /** Destes, quantos ENTRARAM neste dia. */
  novos: number
}

export interface TimelineHospital {
  hospital_key: string
  hospital_nome: string
  total_censos: number
  dias: CensoDia[]
}

/** Paciente que o censo trouxe, mas que já estava com alta no sistema. */
export interface MantidoComAlta {
  atendimento?: string | null
  nome?: string | null
  /** Alta que já estava registrada (ISO). */
  data_alta?: string | null
  /** Entrada que o censo trouxe — anterior ou igual à alta, por isso não reabriu. */
  data_entrada?: string | null
}

export interface UploadCensoResponse {
  sessao: string
  resultados: UploadCensoResult[]
}

/** Hospital informado pelo usuário para um arquivo cujo hospital o PDF não trouxe
 *  no cadastro: um hospital cadastrado (`key`) OU um novo (`nome` + `operadora_key`,
 *  auto-cadastrado ao processar). */
export interface HospitalManual {
  key?: string
  nome?: string
  operadora_key?: string
}

// Corpo de POST /api/upload/pendencia/{id}/completar — só os campos enviados
// sobrepõem o que o parser extraiu.
export interface CompletarPendenciaPayload {
  hospital_key?: string | null
  atendimento?: string | null
  nome?: string | null
  data_entrada?: string | null
  data_alta?: string | null
}

/** `ok=false` com 200 = ainda falta algo: `campos_faltantes` diz o quê. */
export interface CompletarPendenciaResponse {
  ok: boolean
  pendencia_id?: number
  /** Situação com que o paciente entrou — soma na coluna certa do placar do upload. */
  situacao?: 'INTERNADO' | 'ALTA' 
  erro?: string
  motivos?: string[]
  campos_faltantes?: CampoCenso[]
}

// Dados do paciente novo a cadastrar (Visão Geral → "Adicionar paciente").
// hospital_key/atendimento/nome/data_entrada são obrigatórios; o resto é opcional.
export interface PacienteNovo {
  hospital_key: string
  atendimento: string
  nome: string
  data_entrada: string
  data_alta?: string | null
  tipo_leito?: string | null
  especialidade?: string | null
  medico?: string | null
}

// Resposta de POST /api/internacoes (adicionar paciente manualmente na Visão Geral).
// `ja_existia` = o (hospital, atendimento) já tinha internação; não duplicou.
export interface CriarInternacaoResponse {
  ok: boolean
  internacao_id: number
  ja_existia?: boolean
}

export interface InternacaoDados {
  id: number
  /**
   * Vazio nos censos que não têm coluna de paciente: o hospital identifica a
   * internação pela `senha` de autorização. Use `identificacaoPaciente()`
   * (lib/texto) para exibir — nunca `nome` cru.
   */
  nome: string | null
  /** Senha de autorização do convênio; identifica o paciente quando não há nome. */
  senha?: string | null
  atendimento?: string | null
  /** Número do paciente na operadora, lido do censo (migration 0028). */
  carteirinha?: string | null
  hospital_nome?: string | null
  hospital_key?: string | null
  tipo_leito?: string | null
  leito_codigo?: string | null
  especialidade?: string | null
  diagnostico?: string | null
  medico?: string | null
  idade?: string | null
  sexo?: string | null
  dias?: number | null
  dias_sem_relatorio?: number | null
  dias_ate_vencer?: number | null
  janela_relatorio?: number | null
  gatilho?: number | null
  data_entrada?: string | null
  data_ultima_visita?: string | null
  status?: string | null
  status_relatorio?: string | null
  longa_10?: boolean
  longa_30?: boolean
  obs?: string | null
  operadora_key?: string | null
  /** Visita marcada pelo técnico (ver KanbanTarefa). */
  visita_agendada?: boolean | null
  visita_agendada_em?: string | null
  visita_agendada_por?: string | null
  visita_agendada_medico?: string | null
  visita_agendada_hora?: string | null
  visita_agendada_vencida?: boolean | null
}

export type TimelineVariante =
  | 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'muted'

export interface TimelineEvento {
  tipo: string
  titulo: string
  descricao?: string | null
  /** Data ISO (YYYY-MM-DD ou timestamp). Ausente nos marcos "Hoje". */
  data?: string | null
  /** Marco do estado atual (Pendente) — exibido como "Hoje", sem data. */
  hoje?: boolean
  variante: TimelineVariante
  /** Quem registrou (e-mail/identificador). Presente em eventos de relatório. */
  autor?: string | null
  /** Papel de quem registrou — colore o relatório na timeline. Null = histórico. */
  autor_role?: UserRole | string | null
  /** Médico auditor do relatório — exibido na timeline no lugar do autor. */
  medico?: string | null
  /** Exclusivo de VISITA_AGENDADA (migration 0034): 'agendada' | 'cancelada'.
   *  Cancelar atualiza o MESMO evento, então este campo é o que diferencia os
   *  dois estados de um card que, no banco, é uma linha só. */
  status_visita?: string | null
  /** Horário da visita ("HH:MM"), migration 0035. Só em VISITA_AGENDADA. */
  hora?: string | null
}

export interface InternacaoTimeline {
  internacao_id: number
  status_relatorio?: string | null
  eventos: TimelineEvento[]
}

/** Um relatório registrado na internação — alimenta o card "Relatórios" da ficha. */
export interface RelatorioItem {
  id: number
  /** Data clínica da visita (YYYY-MM-DD). */
  data_visita?: string | null
  medico?: string | null
  descricao?: string | null
  /** Timestamp (data+hora) de quando o relatório foi anexado ao sistema. */
  criado_em?: string | null
  /** Quem anexou (e-mail/identificador). */
  autor?: string | null
  /** Papel de quem anexou — colore o marcador, igual à timeline. */
  autor_role?: UserRole | string | null
  fonte?: string | null
  /** True quando há documento anexado (baixável via /relatorio/:id/arquivo). */
  tem_anexo?: boolean
}

export interface InternacaoRelatorios {
  internacao_id: number
  relatorios: RelatorioItem[]
}
