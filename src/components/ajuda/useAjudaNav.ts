// Estado compartilhado da navegação da Ajuda.
//
// A Sidebar do app vira o índice dos módulos enquanto a tela de Ajuda está
// aberta, e a própria página precisa do mesmo módulo atual para o painel e o
// paginador. Como as duas montam em ramos diferentes da árvore, a origem da
// verdade é a URL (?modulo=) — e não um estado local que uma passaria à outra
// por props.
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { modulosVisiveis } from './catalogo'
import type { ModuloAjuda } from './tipos'

export interface AjudaNav {
  /** Módulos que o papel atual pode ler, na ordem do catálogo. */
  modulos: ModuloAjuda[]
  /** Módulo aberto (o 1º visível quando a URL não diz outro). */
  atual: ModuloAjuda | undefined
  indice: number
  total: number
  irPara: (id: string) => void
}

export function useAjudaNav(): AjudaNav {
  const { role, perfilCarregando } = useAuth()
  const [params, setParams] = useSearchParams()

  // Antes de o papel resolver, `podeVer(null, ...)` liberaria tudo e a lista
  // encolheria ao resolver (módulos piscando no menu). Segura até lá.
  const modulos = useMemo(
    () => (perfilCarregando ? [] : modulosVisiveis(role)),
    [role, perfilCarregando],
  )

  const moduloUrl = params.get('modulo') || ''
  const indice = Math.max(0, modulos.findIndex((m) => m.id === moduloUrl))

  const irPara = useCallback((id: string) => {
    setParams((p) => {
      const novo = new URLSearchParams(p)
      novo.set('modulo', id)
      return novo
    }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setParams])

  return { modulos, atual: modulos[indice], indice, total: modulos.length, irPara }
}
