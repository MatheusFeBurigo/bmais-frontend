// Tipos do catálogo de módulos da Ajuda, separados dos ícones (modulos.tsx):
// um arquivo que exporta componentes E constantes quebra o fast refresh, e esta
// metade é consumida por quem não desenha nada (catálogo, hook de navegação).
import type { ComponentType, LazyExoticComponent } from 'react'
import type { Screen } from '../../auth/permissions'

export interface ModuloAjuda {
  /** Id estável: é o que vai para o progresso salvo e para o hash da URL. */
  id: string
  titulo: string
  subtitulo: string
  /** Seção do índice (agrupa os módulos como o menu agrupa as telas). */
  secao: SecaoAjuda
  /** Tela que este módulo documenta. Ausente = transversal (todos os papéis).
   *
   *  É por aqui que a Ajuda herda a hierarquia de acesso da aplicação: quem não
   *  enxerga a tela não recebe o módulo que a descreve, sem uma segunda regra
   *  para manter em dia. */
  screen?: Screen
  icone: ComponentType
  /** Corpo do módulo. `irPara` troca o módulo aberto (referências cruzadas).
   *  Vem de `lazy()` no catálogo, então quem renderiza precisa de <Suspense>. */
  corpo: LazyExoticComponent<ComponentType<{ irPara: (id: string) => void }>>
}

export type SecaoAjuda = 'Introdução' | 'Operação' | 'Gestão' | 'Administração' | 'Referência'

/** Ordem das seções no índice — do primeiro contato ao anexo de referência. */
export const SECOES: readonly SecaoAjuda[] = [
  'Introdução', 'Operação', 'Gestão', 'Administração', 'Referência',
]
