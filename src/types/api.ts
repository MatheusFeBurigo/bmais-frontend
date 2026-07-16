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
export type UserRole = 'admin' | 'diretor' | 'analista'

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
  role: UserRole
  criado_em?: string
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
  dia: string      // ISO (para navegação)
  label: string    // dd/mm
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
  hoje: DiaMetricas
  serie_30d: SerieDia[]
  media_mes: MediaPeriodo
  media_semestre: MediaPeriodo
  media_ano: MediaPeriodo
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
export interface RelatorioMatch {
  internacao_id: number
  nome_db: string
  score: number
  [k: string]: unknown
}

export interface RelatorioAplicado {
  nome_raw: string
  match: RelatorioMatch
  descricao_preview: string
}

export interface RelatorioBaixaConfianca {
  nome_raw: string
  candidatos: RelatorioMatch[]
  descricao: string
}

export interface RelatorioSemMatch {
  nome_raw: string
  descricao: string
}

export interface RelatorioLoteResult {
  arquivo: string
  hospital_key?: string
  medico?: string | null
  data_relatorio?: string | null
  total_entries?: number
  aplicados?: RelatorioAplicado[]
  baixa_confianca?: RelatorioBaixaConfianca[]
  sem_match?: RelatorioSemMatch[]
  erro?: string
}

export interface RelatorioLoteResponse {
  resultados: RelatorioLoteResult[]
}

// Resposta de POST /api/relatorios/refresh (pasta local, totais agregados).
export interface RelatorioRefreshResponse {
  arquivos: number
  aplicados: number
  baixa_confianca: number
  sem_match: number
  resultados: RelatorioLoteResult[]
  erro?: string
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
