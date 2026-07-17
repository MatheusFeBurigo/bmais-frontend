// Serviço de dados do domínio "usuarios" (contas de acesso/login).
import { apiFetch } from '../api/client'
import type { UsuariosPayload, UserRole } from '../types/api'

/** Lista de usuários de acesso (admin only). */
export function fetchUsuarios(): Promise<UsuariosPayload> {
  return apiFetch<UsuariosPayload>('/usuarios')
}

/** Cria um novo usuário de acesso com papel. */
export function criarUsuario(email: string, password: string, role: UserRole): Promise<unknown> {
  return apiFetch('/usuarios', { method: 'POST', body: { email: email.trim(), password, role } })
}
