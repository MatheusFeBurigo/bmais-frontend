// Rótulos, descrições e variantes de badge dos papéis de usuário (role).
// Compartilhado entre a lista (UsuariosAcesso) e o formulário (UsuarioForm).
import type { UserRole } from '../types/api'

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gestor: 'Gestor',
  administrativo: 'Operacional',
  tecnico: 'Técnico',
  analista: 'Analista interno',
  coordenador_administrativo: 'Coordenador operacional',
  coordenador_tecnico: 'Coordenador técnico',
  medico: 'Médico',
  enfermeiro: 'Enfermeiro',
}

export const ROLE_VARIANT: Record<UserRole, 'danger' | 'info' | 'success' | 'caution' | 'muted'> = {
  admin: 'danger',
  diretor: 'info',
  gestor: 'caution',
  administrativo: 'success',
  tecnico: 'success',
  // Neutro: é um perfil de observação, não de operação.
  analista: 'muted',
  coordenador_administrativo: 'info',
  coordenador_tecnico: 'info',
  medico: 'muted',
  enfermeiro: 'muted',
}

export const ROLE_DESC: Record<UserRole, string> = {
  admin: 'Acesso total: Operações (equipe, contas e cadastro), Movimentações e ações destrutivas.',
  diretor: 'Diretoria, Gestor e Configurações. Não vê Operações.',
  gestor: 'Gestor/Fluxo, Painel Operacional, Tarefas, Envio de censos e Configurações. Não vê Diretoria nem Operações.',
  administrativo: 'Painel Operacional, Upload e Kanban. Não vê Diretoria, Gestor nem Operações.',
  tecnico: 'Análise técnica dos relatórios do auditor externo. Emite o parecer interno.',
  analista: 'Consulta o Painel Operacional, o Kanban e as Movimentações (trilha de auditoria) e mantém hospitais e operadoras em Operações. Não registra relatórios nem altera dados de paciente. Não vê Diretoria nem Gestor.',
  coordenador_administrativo: 'Distribuição de tarefas: vê a carga de cobranças de censo de cada operacional em horas (rede inteira), define quais hospitais cada um cobre e calibra capacidade e parâmetros de carga. Envia censos. Não altera pacientes nem cadastros.',
  coordenador_tecnico: 'Distribuição de tarefas: vê a carga de pacientes de cada técnico em horas de análise (rede inteira), define quais hospitais cada um cobre e calibra capacidade e parâmetros de carga. Envia censos. Não altera pacientes nem cadastros.',
  // Não aparecem na escolha de papel (ROLES_ORDEM): a conta nasce na ficha do
  // profissional e o papel sai do tipo dele.
  medico: 'Médico da equipe assistencial. Entra no portal do profissional; não vê dados internos.',
  enfermeiro: 'Enfermeiro da equipe assistencial. Entra no portal do profissional; não vê dados internos.',
}

// Ordem de exibição dos papéis nos cards de seleção (mais básico → mais amplo).
export const ROLES_ORDEM: readonly UserRole[] = [
  'analista', 'tecnico', 'coordenador_tecnico', 'administrativo', 'coordenador_administrativo',
  'gestor', 'diretor', 'admin',
]

// Papéis operacionais que têm recorte de dados (escopo). O técnico analisa por
// HOSPITAL (todas as operadoras dele); o operacional atende OPERADORAS inteiras,
// em todos os hospitais delas (0053). Os demais (gestor/diretor/admin) veem tudo.
// O analista interno e os dois coordenadores também ficam de fora: são perfis de
// observação, criados como conta simples (sem área) e enxergando toda a
// operação — os coordenadores de propósito (supervisionam a rede inteira).
const COM_ESCOPO_HOSPITAL: ReadonlySet<UserRole> = new Set(['tecnico'])
const COM_ESCOPO_OPERADORA: ReadonlySet<UserRole> = new Set(['administrativo'])
export function temEscopoHospital(role: UserRole): boolean {
  return COM_ESCOPO_HOSPITAL.has(role)
}
export function temEscopoOperadora(role: UserRole): boolean {
  return COM_ESCOPO_OPERADORA.has(role)
}
