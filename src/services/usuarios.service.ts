// Serviço de dados do domínio "usuarios" (contas de acesso/login).
import { apiFetch } from '../api/client'
import type { UsuariosPayload, UserRole } from '../types/api'

/** Lista de usuários de acesso (admin only). */
export function fetchUsuarios(): Promise<UsuariosPayload> {
  return apiFetch<UsuariosPayload>('/usuarios')
}

/** Cria um novo usuário de acesso com nome, papel e hospitais associados. */
export function criarUsuario(
  email: string, password: string, role: UserRole, hospitais: string[] = [],
  nome: string = '',
): Promise<unknown> {
  return apiFetch('/usuarios', {
    method: 'POST',
    body: { email: email.trim(), password, role, hospitais, nome: nome.trim() },
  })
}

/** Atualiza nome, papel e/ou hospitais de um usuário existente. */
export function atualizarUsuario(
  userId: string, patch: { role?: UserRole; hospitais?: string[]; nome?: string },
): Promise<unknown> {
  return apiFetch(`/usuarios/${userId}`, { method: 'PATCH', body: patch })
}

/** Admin redefine a senha de um usuário existente (não pede a senha atual). */
export function redefinirSenhaUsuario(userId: string, password: string): Promise<unknown> {
  return apiFetch(`/usuarios/${userId}/senha`, { method: 'PATCH', body: { password } })
}

/** O usuário logado troca a própria senha. */
export function alterarMinhaSenha(password: string): Promise<unknown> {
  return apiFetch('/me/senha', { method: 'POST', body: { password } })
}
