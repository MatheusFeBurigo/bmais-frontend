// Tipos espelhando o JSON retornado pela API FastAPI.

export interface Operadora {
  key: string
  nome: string
  ativo?: boolean
  [k: string]: unknown
}

export interface Hospital {
  key: string
  nome: string
  operadora_key?: string
  operadora_nome?: string | null
  regiao?: string | null
  internados: number
  urgente: number
  altas: number
  [k: string]: unknown
}

export interface Internacao {
  id: number
  nome: string
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
  data_ultima_visita?: string | null
  status?: string
  status_relatorio?: string
  status_rvm?: string
  longa_10?: boolean
  longa_30?: boolean
  // Limites reais de longa permanência (em dias), configurados por operadora.
  limite_longa?: number | null
  limite_avancada?: number | null
  alerta_relatorio?: boolean
  em_monitoramento?: boolean
  obs?: string | null
  operadora_key?: string
  [k: string]: unknown
}

export interface DashboardStats {
  hoje_efetivo?: string
  total_internados?: number
  sem_relatorio?: number
  relatorio_vencido?: number
  proximo_vencer?: number
  relatorio_em_dia?: number
  em_monitoramento?: number
  aguardando_gatilho?: number
  longa_permanencia?: number
  longa_avancada?: number
  total_altas?: number
  por_hospital?: Array<Record<string, unknown>>
  [k: string]: unknown
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
  // redireciona à 1ª operadora permitida (ver Dashboard.tsx).
  sem_acesso?: boolean
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

export interface SidebarOp {
  key: string
  nome: string
  [k: string]: unknown
}

export interface SidebarData {
  operadoras: Operadora[]
  sidebar_ops: SidebarOp[]
  hoje_efetivo: string
  sidebar_prof_count: number
}

// Papel de acesso do usuário (espelha a tabela `profiles` do backend).
export type UserRole = 'admin' | 'diretor' | 'gestor' | 'administrativo' | 'tecnico'

export interface LoginResponse {
  token: string
  username: string
  expires_in: number
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
}

// ── Gestão de usuários de acesso (contas de login) ──────────────────────────
export interface Usuario {
  user_id: string
  email: string | null
  /** Nome de exibição (opcional; contas antigas podem não ter). */
  nome?: string | null
  role: UserRole
  criado_em?: string
  /** Keys dos hospitais associados. Vazio = sem restrição (vê todos). */
  hospitais?: string[]
}

export interface UsuariosPayload {
  usuarios: Usuario[]
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
  [k: string]: unknown
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
  [k: string]: unknown
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
  [k: string]: unknown
}

export interface HospitalSelected {
  key: string
  nome: string
  regiao?: string | null
  internados: number
  escala: Escala[]
  internacoes: HospitalInternacao[]
  [k: string]: unknown
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
}

export interface PacienteDia {
  id: number
  nome: string
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
// Quadro por TIPO/categoria (não por progresso). Três colunas, cada uma com sua
// fonte: pendências de parsing (persistidas) + pacientes sem relatório/vencido
// (derivados de status_relatorio, sempre atuais).

/** Coluna do kanban = categoria de tarefa. */
export type KanbanColuna = 'refazer_analise' | 'revisao_relatorio' | 'sem_relatorio' | 'cobrancas' | 'analise_tecnica'

/** Relatório do auditor externo a analisar (card da coluna analise_tecnica). */
export interface RelatorioExterno {
  relatorio_id?: number | null
  data_visita?: string | null
  medico?: string | null
  descricao?: string | null
  autor?: string | null
  tem_arquivo?: boolean
}

/** Um card de tarefa. `internacao_id` presente → abre o drawer do paciente.
 *  `pendencia_id` presente → é pendência de parsing (resolúvel).
 *  `relatorio` presente → é pendência de relatório (abre a modal de encaixe). */
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
  /** Pendência de parsing (só coluna refazer_analise) — habilita "resolver". */
  pendencia_id?: number | null
  /** Motivos da pendência (refazer_analise) — por que a extração falhou. */
  motivos?: string[]
  /** Dias sem relatório (sem_relatorio/vencidos), para priorização. */
  dias_sem_relatorio?: number | null
  arquivo?: string | null        // arquivo de origem (pendência)
  /** True se há PDF anexado no Storage — habilita o link "Ver PDF" no card. */
  tem_pdf?: boolean
  /** Pendência de relatório (coluna revisao_relatorio): payload completo do card
   *  de revisão, consumido pela modal de encaixe (sugestões, campos, documento). */
  relatorio?: RelatorioRevisaoItem
  /** Cobrança de censo (coluna cobrancas) — habilita "marcar cobrado". */
  cobranca_id?: number | null
  /** Dia cujo censo faltou (YYYY-MM-DD). */
  data_ref?: string | null
  /** Timestamp ISO do último censo enviado pelo hospital (null = nunca). */
  ultimo_censo?: string | null
  /** Há quantos dias foi o último censo (null se nunca enviou). */
  dias_sem_censo?: number | null
  /** Análise técnica (coluna analise_tecnica) — habilita concluir o parecer. */
  analise_id?: number | null
  /** Relatório do auditor externo que o técnico vai analisar. */
  relatorio_externo?: RelatorioExterno
}

/** Colunas de tarefas. O board do técnico traz só `analise_tecnica`; o do
 *  administrativo, as operacionais. Todas opcionais para cobrir os dois papéis. */
export interface KanbanColunas {
  refazer_analise?: KanbanTarefa[]
  revisao_relatorio?: KanbanTarefa[]
  sem_relatorio?: KanbanTarefa[]
  cobrancas?: KanbanTarefa[]
  analise_tecnica?: KanbanTarefa[]
}

/** Hospital para o dropdown de "criar paciente" (cadastro completo do escopo). */
export interface HospitalCriacao {
  key: string
  nome: string
  operadora_key?: string | null
}

/** Payload do GET /api/kanban — tarefas + opções de filtro (recortadas ao escopo).
 *  `filtros` reusa o mesmo formato do Gestor (operadoras/hospitais do escopo). */
export interface KanbanPayload {
  /** Qual board o backend montou: 'tecnico' (só análise técnica), 'administrativo'
   *  (4 operacionais) ou 'admin' (quadro completo: operacionais + análise técnica). */
  papel?: 'tecnico' | 'administrativo' | 'admin'
  tarefas: KanbanColunas
  filtros: GestorFiltros
  /** Hospitais do escopo para cadastrar um paciente não vinculado na modal de encaixe. */
  hospitais_criacao?: HospitalCriacao[]
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
  [k: string]: unknown
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
  aguardando_gatilho: number
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
  [k: string]: unknown
}

// ── Upload de censos (POST /api/upload) ─────────────────────────────────────
export interface UploadCensoResult {
  arquivo: string
  hospital?: string
  hospital_nome?: string
  tipo?: string
  total?: number
  erro?: string
}

export interface UploadCensoResponse {
  sessao: string
  resultados: UploadCensoResult[]
}

// ── Upload de relatórios em lote (POST /api/relatorios/upload) ───────────────
// Relatório completo é gravado direto na internação casada; incompleto vai ao Kanban.

export interface RelatorioLoteResult {
  arquivo: string
  hospital_key?: string
  hospital_nome?: string | null
  medico?: string | null
  data_relatorio?: string | null
  total_entries?: number
  // Entradas completas gravadas automaticamente na internação casada.
  aplicados_auto?: number
  // Entradas incompletas enviadas para revisão humana (card no Kanban).
  enviados_revisao?: number
  erro?: string
}

export interface RelatorioLoteResponse {
  resultados: RelatorioLoteResult[]
}

// Resposta de POST /api/relatorios/refresh (pasta local, totais agregados).
export interface RelatorioRefreshResponse {
  arquivos: number
  aplicados_auto?: number
  enviados_revisao: number
  resultados: RelatorioLoteResult[]
  erro?: string
}

// ── Encaixe de relatório (coluna "Revisão Relatório" do Kanban) ─────────────
// Payload de um card de relatório a encaixar numa internação (revisão humana).
// Chega aninhado em KanbanTarefa.relatorio e alimenta a modal de encaixe.
export interface RelatorioRevisaoItem {
  pendencia_id: number
  hospital_key?: string | null
  hospital_nome?: string | null
  operadora_key?: string | null
  nome_raw?: string | null
  descricao?: string | null
  medico?: string | null
  data_relatorio?: string | null
  status_indicado?: string | null
  // Campos que o parser NÃO conseguiu capturar (badges): hospital|paciente|observações|médico|data.
  campos_faltantes: string[]
  // Internação (paciente) casada pelo nome (determinístico), pré-preenchendo o encaixe.
  // null quando o nome não casou ('paciente' em campos_faltantes) — revisor escolhe à mão.
  internacao_id?: number | null
  arquivo?: string | null
  tem_arquivo?: boolean
  criado_em?: string | null
}

// Corpo de POST /api/relatorios/revisao/{id}/confirmar — campos possivelmente editados.
export interface ConfirmarEncaixePayload {
  internacao_id: number
  data_visita?: string | null
  medico?: string | null
  descricao?: string | null
}

// Dados do paciente novo a cadastrar (modal de encaixe → "Criar paciente").
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

// Item do autocomplete de busca de internações (seletor de encaixe no Kanban).
export interface InternacaoBusca {
  id: number
  nome: string
  atendimento?: string | null
  hospital_key?: string | null
  hospital_nome?: string | null
  status?: string | null
  data_entrada?: string | null
}

// Corpo de POST /api/relatorios/revisao/{id}/criar-encaixar — cria a internação e encaixa.
export interface CriarEncaixePayload {
  paciente: PacienteNovo
  data_visita?: string | null
  medico?: string | null
  descricao?: string | null
}

export interface InternacaoDados {
  id: number
  nome: string
  atendimento?: string | null
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
