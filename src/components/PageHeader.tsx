import { useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

// Conteúdo do topbar (título/subtítulo/ações) que cada página empurra para o
// AppLayout persistente. Como o Layout monta UMA vez e só o miolo (<Outlet/>)
// troca por rota, o header não vem mais como props do Layout: a página o
// registra por aqui e o topbar do layout renderiza o registrado.
//
// O estado vive num store externo (pub/sub), não em Context. Motivo: title/
// actions são JSX recriados a cada render da página; se o setter re-renderizasse
// a página (como faria um Context acima do <Outlet/>), o efeito de registro
// dispararia de novo e entraria em loop. Com store externo, publicar o header
// re-renderiza SÓ quem assina (o topbar) — nunca a própria página.
export interface PageHeader {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

let current: PageHeader = { title: '' }
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// Lido pelo AppLayout para pintar o topbar. Assina o store; re-renderiza o
// topbar quando o header publicado muda.
export function usePageHeaderValue(): PageHeader {
  return useSyncExternalStore(subscribe, () => current)
}

// Chamado pelas páginas para definir o topbar. Substitui o antigo
// `<Layout title=... subtitle=... actions=...>`. Reage a mudanças de valor
// (título/ações dinâmicos que dependem de dados carregados na página).
export function usePageHeader(header: PageHeader) {
  const { title, subtitle, actions } = header
  // Publica quando qualquer campo observado muda de identidade. A próxima página
  // a montar simplesmente sobrescreve o header — não há o que restaurar.
  useEffect(() => {
    current = { title, subtitle, actions }
    emit()
  }, [title, subtitle, actions])
}
