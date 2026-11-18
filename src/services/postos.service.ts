// Módulo 2 > Agenda de serviços (17/11/2026, migration 0066): os postos de cada
// auditor (hospital, operadora, serviço, de quando a quando). É o que o App do
// auditor lê nas abas Senhas, Contas e Visitas. Backend: routes/postos.py.
import { apiFetch } from '../api/client'

/** vigente (vale hoje), futuro (começa depois), encerrado (já terminou), desfeito (saiu antes de começar). */
export type SituacaoPosto = 'vigente' | 'futuro' | 'encerrado' | 'desfeito'
/** Só no posto de validação de senha (S). null = todo dia. */
export type TipoDia = 'util' | 'fds'

export interface Posto {
  id: number
  hospital_key: string
  hospital_nome: string
  cidade: string
  uf: string
  operadora_key: string
  operadora_nome: string
  servico: string
  servico_nome: string
  tipo_dia: TipoDia | null
  tipo_dia_nome: string | null
  profissional_id: number | null
  profissional_nome: string | null
  /** 'M' médico, 'E' enfermeiro. */
  profissional_tipo: string | null
  profissional_ativo: boolean
  /** null = linha de antes da agenda (vale desde sempre). */
  data_inicio: string | null
  data_fim: string | null
  situacao: SituacaoPosto
}

export interface HospitalOpcao {
  key: string
  nome: string
  cidade: string
  uf: string
  operadoras: { key: string; nome: string }[]
}

export interface PessoaOpcao { id: number; nome: string }

export interface ListaPostos {
  /** Falso enquanto a migration 0066 não estiver no banco: lê, mas não grava. */
  disponivel: boolean
  pode_gerir: boolean
  hoje: string
  tipo_dia_hoje: TipoDia
  postos: Posto[]
  opcoes: {
    hospitais: HospitalOpcao[]
    medicos: PessoaOpcao[]
    enfermeiros: PessoaOpcao[]
    servicos: { codigo: string; nome: string }[]
    tipos_dia: { codigo: TipoDia; nome: string }[]
  }
}

export interface NovoPosto {
  hospital_key: string
  operadora_key: string
  servico: string
  medico_id: number | null
  enfermeiro_id: number | null
  data_inicio: string
  data_fim: string | null
  tipo_dia: TipoDia | null
}

export function fetchPostos(): Promise<ListaPostos> {
  return apiFetch('/postos')
}

export function lancarPosto(body: NovoPosto): Promise<{ postos: Posto[] }> {
  return apiFetch('/postos', { method: 'POST', body })
}

export function trocarPosto(id: number, body: { profissional_id: number; a_partir_de: string; motivo: string | null }):
  Promise<{ saiu: Posto; entrou: Posto }> {
  return apiFetch(`/postos/${id}/trocar`, { method: 'POST', body })
}

export function encerrarPosto(id: number, body: { ultimo_dia: string; motivo: string | null }): Promise<{ posto: Posto }> {
  return apiFetch(`/postos/${id}/encerrar`, { method: 'POST', body })
}

export function desfazerPosto(id: number): Promise<{ posto: Posto }> {
  return apiFetch(`/postos/${id}/desfazer`, { method: 'POST' })
}

// ── A agenda na tela Auditores (como a ficha do prestador do protótipo) ──

/** Os serviços de cada auditor pelos postos vigentes: { "11": ["Contas", "Visitas"] }. */
export function fetchServicosDosAuditores(): Promise<{ servicos: Record<string, string[]> }> {
  return apiFetch('/postos/servicos')
}

/** Uma linha do cartão "Hospitais e serviços": o hospital, as operadoras e os serviços. */
export interface HospitalDoAuditor {
  hospital_key: string
  hospital_nome: string
  cidade: string
  uf: string
  operadoras: string[]
  servicos: string[]
}

export interface AgendaDoAuditor {
  auditor: { id: number; nome: string; tipo: string | null }
  /** Senhas, Contas, Visitas (só os que ele faz hoje), nessa ordem. */
  servicos: string[]
  /** Produção do mês corrente; null = ele não faz o serviço (o quadro não aparece). */
  producao: { mes: string; senhas: number | null; contas: number | null; pacientes: number | null }
  hospitais: HospitalDoAuditor[]
}

export function fetchAgendaDoAuditor(id: number): Promise<AgendaDoAuditor> {
  return apiFetch(`/postos/auditor/${id}`)
}
