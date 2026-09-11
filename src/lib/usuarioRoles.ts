// Rótulos, descrições e variantes de badge dos papéis de usuário (role).
// Compartilhado entre a lista (UsuariosAcesso) e o formulário (UsuarioForm).
import type { UserRole } from '../types/api'

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gestor: 'Gestor',
  administrativo: 'Administrativo',
  tecnico: 'Técnico',
  analista: 'Analista interno',
}

export const ROLE_VARIANT: Record<UserRole, 'danger' | 'info' | 'success' | 'caution' | 'muted'> = {
  admin: 'danger',
  diretor: 'info',
  gestor: 'caution',
  administrativo: 'success',
  tecnico: 'success',
  // Neutro: é um perfil de observação, não de operação.
  analista: 'muted',
}

export const ROLE_DESC: Record<UserRole, string> = {
  admin: 'Acesso total: Operações (equipe, contas e cadastro), Movimentações e ações destrutivas.',
  diretor: 'Diretoria, Gestor e Configurações. Não vê Operações.',
  gestor: 'Gestor/Fluxo, Upload e Configurações. Não vê Diretoria, Operacional nem Operações.',
  administrativo: 'Operacional, Upload e Kanban. Não vê Diretoria, Gestor nem Operações.',
  tecnico: 'Análise técnica dos relatórios do auditor externo — emite o parecer interno.',
  analista: 'Consulta o Operacional, o Kanban e as Movimentações (trilha de auditoria) e mantém hospitais e operadoras em Operações. Não registra relatórios nem altera dados de paciente. Não vê Diretoria nem Gestor.',
}

// Ordem de exibição dos papéis nos cards de seleção (mais básico → mais amplo).
export const ROLES_ORDEM: readonly UserRole[] = ['analista', 'tecnico', 'administrativo', 'gestor', 'diretor', 'admin']

// Papéis operacionais que têm recorte de dados por hospital (escopo). Os demais
// (gestor/diretor/admin) veem tudo — o UsuarioForm só mostra o multiselect para estes.
// O analista interno também fica de fora: é um perfil de observação, criado como
// conta simples (sem lista de hospitais) e enxergando toda a operação.
const COM_ESCOPO_HOSPITAL: ReadonlySet<UserRole> = new Set(['administrativo', 'tecnico'])
export function temEscopoHospital(role: UserRole): boolean {
  return COM_ESCOPO_HOSPITAL.has(role)
}
