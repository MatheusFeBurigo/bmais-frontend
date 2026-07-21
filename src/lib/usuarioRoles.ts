// Rótulos, descrições e variantes de badge dos papéis de usuário (role).
// Compartilhado entre a lista (UsuariosAcesso) e o formulário (UsuarioForm).
import type { UserRole } from '../types/api'

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gestor: 'Gestor',
  analista: 'Analista',
}

export const ROLE_VARIANT: Record<UserRole, 'danger' | 'info' | 'success' | 'caution'> = {
  admin: 'danger',
  diretor: 'info',
  gestor: 'caution',
  analista: 'success',
}

export const ROLE_DESC: Record<UserRole, string> = {
  admin: 'Acesso total, incluindo gestão de usuários e ações destrutivas.',
  diretor: 'Diretoria, Gestor e Configurações. Não vê Equipe.',
  gestor: 'Gestor/Fluxo, Upload e Configurações. Não vê Diretoria, Operacional nem Equipe.',
  analista: 'Operacional e Upload. Não vê Diretoria, Gestor nem Equipe.',
}

// Ordem de exibição dos papéis nos cards de seleção.
export const ROLES_ORDEM: readonly UserRole[] = ['analista', 'gestor', 'diretor', 'admin']
