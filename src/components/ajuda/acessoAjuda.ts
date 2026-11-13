// Quem lê o quê dentro da Ajuda, além do gating por tela do catálogo.
//
// Todo comentário sobre o que a diretoria e a gestão veem ou fazem (as telas de
// decisão, os perfis Gestor e Diretor na matriz, os indicadores gerenciais) é
// reservado a quem tem essa competência. Um técnico que lê "Perfis de acesso"
// não precisa saber o que o Dashboard da Diretoria mostra, pela mesma razão que
// não o encontra no menu (decisão do usuário, 25/09/2026).
//
// O admin é o único sem exceção: vê a Ajuda inteira, como vê todas as telas
// (Diretoria e Gestor voltaram a ele em 27/09/2026, ver auth/permissions.ts).
//
// O analista interno lê além do próprio menu: recebe os módulos de TODAS as
// telas, inclusive as que não abre (Envio de Censos, Configurações,
// Distribuição de tarefas, Progresso), menos os das telas de decisão (decisão
// do usuário, 29/09/2026). Os trechos de gestão dentro dos demais módulos
// (`SoGestao`) seguem fechados para ele.
//
// Exceção nos perfis: o analista interno lê o quadro de perfis e a matriz inteiros,
// com Gestor e Diretor, porque cria as contas desses tipos e precisa saber o que
// cada um faz para escolher (decisão do usuário, 05/11/2026). Vale só para ele e
// só para esses dois quadros: os outros papéis seguem sem ver Gestor e Diretor.
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

/** Pode ler Gestor e Diretor no quadro de perfis e na matriz? Quem tem a
 *  competência de gestão e o analista interno. */
export function useVeTodosOsPerfis(): boolean {
  const { role } = useAuth()
  return veGestao(role) || leAlemDoMenu(role)
}

// Filtro "Todos os pacientes" do Painel Operacional (09/11/2026): é do técnico e
// do coordenador técnico (espelha ROLES_VER_TODOS_PACIENTES no backend). Leem o
// passo a passo esses dois, quem lê a gestão (acompanha a equipe técnica) e o
// analista, que lê além do menu. O operacional não tem o filtro.
const PAPEIS_TODOS_OS_PACIENTES: readonly UserRole[] = ['tecnico', 'coordenador_tecnico']

/** Pode ler sobre o filtro "Todos os pacientes"? */
export function leSobreTodosOsPacientes(role: UserRole | null): boolean {
  return (role != null && PAPEIS_TODOS_OS_PACIENTES.includes(role))
    || veGestao(role) || leAlemDoMenu(role)
}

export function useLeSobreTodosOsPacientes(): boolean {
  return leSobreTodosOsPacientes(useAuth().role)
}

/** Papéis que a réplica do cadastro de conta mostra: os da tela real, sem o de
 *  administrador, que a Ajuda não descreve. */
export const PAPEIS_CADASTRO: readonly UserRole[] = ROLES_ORDEM.filter((r) => r !== 'admin')
