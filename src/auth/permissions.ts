// Regras de acesso por papel (role) — fonte única de verdade da UI.
//
// Mapeia cada papel às telas que ele NÃO pode ver. Sidebar e roteamento
// consultam `podeVer(role, screen)` para esconder o menu e bloquear a rota.
// Este gating é de UI/conveniência; a autorização definitiva é do backend.
//
// Para adicionar uma regra: inclua a screen em BLOQUEADAS[role]. Papéis sem
// entrada (ou role null) veem tudo por padrão.
import type { UserRole } from '../types/api'

// Identificador estável de cada tela navegável (independe da rota/label).
export type Screen =
  | 'operacional'
  | 'diretoria'
  | 'gestor'
  | 'configuracoes'
  | 'equipe'
  | 'upload'

// Telas que cada papel NÃO pode ver. Ausência de entrada = vê tudo.
const BLOQUEADAS: Partial<Record<UserRole, readonly Screen[]>> = {
  // Diretor vê tudo, exceto Equipe.
  diretor: ['equipe'],
  // Analista não vê Equipe nem Diretoria.
  analista: ['equipe', 'diretoria'],
}

/** True se o papel pode ver a tela. `role` null/desconhecido não restringe. */
export function podeVer(role: UserRole | null, screen: Screen): boolean {
  if (!role) return true
  const bloqueadas = BLOQUEADAS[role]
  return !bloqueadas?.includes(screen)
}

// Rota de destino ao barrar o acesso direto a uma tela bloqueada.
export const ROTA_FALLBACK = '/'
