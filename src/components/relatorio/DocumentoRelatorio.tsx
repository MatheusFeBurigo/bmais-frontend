// O corpo do "Relatório da Auditoria Geral": o documento em si, sem o cabeçalho
// da página (que é da tela, em pages/Relatorio.tsx).
//
// É a transposição do documento `Relatorio_Diretoria.html`, que circulava como
// arquivo solto. O componente APRESENTA o documento, não o reescreve: texto,
// seções e ordem são os do original, palavra por palavra (ver ./conteudo.ts).
// O que muda é a APARÊNCIA: o relatório veste o design-system do BMais (fontes
// Geist, tokens de cor, cartões e tabelas da aplicação), em vez da folha
// editorial que o arquivo original trazia (ver relatorio.css). Acrescenta ainda
// o realce da seção em leitura e a rolagem das âncoras sem sair da rota.
//
// Fica separado da página para que o documento possa ser montado em outro lugar
// (uma pré-visualização, por exemplo) sem arrastar o cabeçalho junto.
import { useEffect, useRef } from 'react'
import { RELATORIO_DOC, RELATORIO_NAV } from './conteudo'
import './relatorio.css'

// Realce do índice lateral conforme a leitura avança: a seção visível marca o
// seu item. É a única parte do script do documento original que continua fazendo
// falta aqui (o botão de tema saiu com a folha original; o de imprimir virou
// ação do cabeçalho da página).
function useIndiceAtivo(raiz: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.toc a'))
    const alvos = links.map((a) => {
      const href = a.getAttribute('href') ?? ''
      // querySelector dentro do container: o documento é injetado aqui, e ids
      // iguais aos de outra parte da página não devem ser alcançados.
      return href.startsWith('#') ? el.querySelector(href) : null
    })

    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue
        const i = alvos.indexOf(e.target)
        if (i < 0) continue
        for (const l of links) {
          l.style.borderLeftColor = 'transparent'
          l.style.color = ''
        }
        links[i].style.borderLeftColor = 'var(--accent)'
        links[i].style.color = 'var(--ink)'
      }
    }, { rootMargin: '-10% 0px -80% 0px' })

    for (const alvo of alvos) if (alvo) obs.observe(alvo)
    return () => obs.disconnect()
  }, [raiz])
}

// Navegação entre seções por âncora. O documento usa href="#id", que o
// react-router interpretaria como rota; então o clique é tratado aqui e vira
// rolagem até o alvo, sem mexer na URL da aplicação (que guarda a aba aberta).
function useAncorasInternas(raiz: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const aoClicar = (ev: MouseEvent) => {
      const alvo = (ev.target as HTMLElement).closest('a')
      if (!alvo) return
      const href = alvo.getAttribute('href')
      if (!href?.startsWith('#')) return
      ev.preventDefault()
      el.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    el.addEventListener('click', aoClicar)
    return () => el.removeEventListener('click', aoClicar)
  }, [raiz])
}

export default function DocumentoRelatorio() {
  const raiz = useRef<HTMLDivElement>(null)
  useIndiceAtivo(raiz)
  useAncorasInternas(raiz)

  return (
    <div className="rel-doc" ref={raiz}>
      {/*
        O HTML injetado é constante do próprio código: não vem de usuário, de
        upload nem da rede, e é o mesmo em toda sessão. É o que torna o
        dangerouslySetInnerHTML seguro aqui — se um dia o documento passar a
        chegar de fora, este é o ponto que precisa de sanitização.
      */}
      <div dangerouslySetInnerHTML={{ __html: RELATORIO_NAV }} />
      <div dangerouslySetInnerHTML={{ __html: RELATORIO_DOC }} />
    </div>
  )
}
