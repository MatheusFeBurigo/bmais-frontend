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
  // Gestor: só Gestor/Fluxo + Upload + Configurações (sem Diretoria, Operacional, Equipe).
  gestor: ['diretoria', 'operacional', 'equipe'],
  // Analista: só Operacional + Upload (sem Diretoria, Gestor, Equipe, Configurações).
  analista: ['diretoria', 'gestor', 'equipe', 'configuracoes'],
}

/** True se o papel pode ver a tela. `role` null/desconhecido não restringe. */
export function podeVer(role: UserRole | null, screen: Screen): boolean {
  if (!role) return true
  const bloqueadas = BLOQUEADAS[role]
  return !bloqueadas?.includes(screen)
}

// Rota de cada tela navegável, para calcular o destino de fallback por papel.
const ROTA_DA_SCREEN: Record<Screen, string> = {
  operacional: '/',
  diretoria: '/diretoria',
  gestor: '/gestor',
  equipe: '/equipe',
  configuracoes: '/configuracoes',
  upload: '/upload',
}

// Ordem de preferência ao escolher a "tela inicial" de um papel barrado.
const ORDEM_FALLBACK: readonly Screen[] = [
  'operacional', 'gestor', 'diretoria', 'upload', 'configuracoes', 'equipe',
]

/** Rota de destino ao barrar o acesso: a 1ª tela que o papel PODE ver.
 *  Ex.: gestor não vê "/" (operacional) → cai em "/gestor". */
export function rotaFallback(role: UserRole | null): string {
  const primeira = ORDEM_FALLBACK.find((s) => podeVer(role, s))
  return primeira ? ROTA_DA_SCREEN[primeira] : '/'
}

// Rota de fallback padrão (papel sem restrições). Mantida para compatibilidade;
// prefira `rotaFallback(role)` quando o papel puder não ver a Operacional.
export const ROTA_FALLBACK = '/'
