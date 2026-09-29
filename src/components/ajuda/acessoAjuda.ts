// Quem lê o quê dentro da Ajuda, além do gating por tela do catálogo.
//
// Todo comentário sobre o que a diretoria e a gestão veem ou fazem (as telas de
// decisão, os perfis Gestor e Diretor na matriz, os indicadores gerenciais) é
// reservado a quem tem essa competência. Um técnico que lê "Perfis de acesso"
// não precisa saber o que o Dashboard da Diretoria mostra, pela mesma razão que
// não o encontra no menu (decisão do usuário, 25/09/2026).
//
// O admin é o único sem exceção: vê a Ajuda inteira, inclusive os módulos de
// telas que ele próprio não acessa (Diretoria e Gestor).
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../types/api'
import { ROLES_ORDEM } from '../../lib/usuarioRoles'

const PAPEIS_GESTAO: readonly UserRole[] = ['gestor', 'diretor']

export function veTudo(role: UserRole | null): boolean {
  return role === 'admin'
}

/** Pode ler o que a Ajuda diz sobre diretoria e gestão? */
export function veGestao(role: UserRole | null): boolean {
  return veTudo(role) || (role != null && PAPEIS_GESTAO.includes(role))
}

export function useVeGestao(): boolean {
  return veGestao(useAuth().role)
}

/** Papéis que a réplica do cadastro de conta mostra: os da tela real, sem o de
 *  administrador, que a Ajuda não descreve. */
export const PAPEIS_CADASTRO: readonly UserRole[] = ROLES_ORDEM.filter((r) => r !== 'admin')
