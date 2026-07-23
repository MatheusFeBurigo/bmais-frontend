// Rótulos, descrições e variantes de badge dos papéis de usuário (role).
// Compartilhado entre a lista (UsuariosAcesso) e o formulário (UsuarioForm).
import type { UserRole } from '../types/api'

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gestor: 'Gestor',
  administrativo: 'Administrativo',
  tecnico: 'Técnico',
}

export const ROLE_VARIANT: Record<UserRole, 'danger' | 'info' | 'success' | 'caution'> = {
  admin: 'danger',
  diretor: 'info',
  gestor: 'caution',
  administrativo: 'success',
  tecnico: 'success',
}

export const ROLE_DESC: Record<UserRole, string> = {
  admin: 'Acesso total, incluindo gestão de usuários e ações destrutivas.',
  diretor: 'Diretoria, Gestor e Configurações. Não vê Equipe.',
  gestor: 'Gestor/Fluxo, Upload e Configurações. Não vê Diretoria, Operacional nem Equipe.',
  administrativo: 'Operacional, Upload e Kanban. Não vê Diretoria, Gestor nem Equipe.',
  tecnico: 'Análise técnica dos relatórios do auditor externo — emite o parecer interno.',
}

// Ordem de exibição dos papéis nos cards de seleção (mais básico → mais amplo).
export const ROLES_ORDEM: readonly UserRole[] = ['tecnico', 'administrativo', 'gestor', 'diretor', 'admin']

// Papéis operacionais que têm recorte de dados por hospital (escopo). Os demais
// (gestor/diretor/admin) veem tudo — o UsuarioForm só mostra o multiselect para estes.
const COM_ESCOPO_HOSPITAL: ReadonlySet<UserRole> = new Set(['administrativo', 'tecnico'])
export function temEscopoHospital(role: UserRole): boolean {
  return COM_ESCOPO_HOSPITAL.has(role)
}
