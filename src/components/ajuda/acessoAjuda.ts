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
//
// O analista interno lê além do próprio menu: recebe os módulos de TODAS as
// telas, inclusive as que não abre (Envio de Censos, Configurações,
// Distribuição de tarefas, Progresso), menos os das telas de decisão (decisão
// do usuário, 29/09/2026). Os trechos de gestão dentro dos demais módulos
// (`SoGestao`) seguem fechados para ele.
import { useAuth } from '../../auth/AuthContext'
import { podeVer, type Screen } from '../../auth/permissions'
import type { UserRole } from '../../types/api'
import { ROLES_ORDEM } from '../../lib/usuarioRoles'

const PAPEIS_GESTAO: readonly UserRole[] = ['gestor', 'diretor']

// Papéis que leem sobre telas que não abrem, e as telas que nem eles leem.
const PAPEIS_LEITURA_AMPLA: readonly UserRole[] = ['analista']
const TELAS_DE_DECISAO: readonly Screen[] = ['diretoria', 'gestor']

export function veTudo(role: UserRole | null): boolean {
  return role === 'admin'
}

/** O índice do papel traz módulos de telas que ele não abre? */
export function leAlemDoMenu(role: UserRole | null): boolean {
  return role != null && PAPEIS_LEITURA_AMPLA.includes(role)
}

export function useLeAlemDoMenu(): boolean {
  return leAlemDoMenu(useAuth().role)
}

/** Pode ler o módulo que documenta a tela? Para quase todo papel é a regra do
 *  menu (`podeVer`); as exceções são o admin e a leitura ampla do analista. */
export function leSobre(role: UserRole | null, screen: Screen): boolean {
  if (veTudo(role)) return true
  if (leAlemDoMenu(role)) return !TELAS_DE_DECISAO.includes(screen)
  return podeVer(role, screen)
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
