// Tela Relatório: o "Relatório da Auditoria Geral" dentro do sistema.
//
// É a transposição do documento `Relatorio_Diretoria.html`, que circulava como
// arquivo solto. Aqui ele passa a ter endereço, e o acesso deixa de depender de
// quem recebeu o anexo: a tela é exclusiva de diretoria e administração
// (screen 'relatorio' em auth/permissions). O próprio documento avisa, no
// rodapé, que traz valores de pagamento e não deve circular fora da diretoria.
//
// A tela APRESENTA o documento, não o reescreve: texto, seções e ordem são os
// do original, palavra por palavra (ver components/relatorio/conteudo.ts). O
// que a tela acrescenta é o que só faz sentido dentro do sistema: o cabeçalho
// da página, o botão de imprimir e o realce da seção que está sendo lida.
import { useEffect, useMemo, useRef } from 'react'
import { usePageHeader } from '../components/PageHeader'
import { RELATORIO_DOC, RELATORIO_NAV } from '../components/relatorio/conteudo'
import '../components/relatorio/relatorio.css'

// Fontes do documento (Source Serif 4 / Source Sans 3 / IBM Plex Mono). Não são
// as do sistema, e sem elas o relatório perde a tipografia que o desenho supõe.
// Carregadas SÓ quando a tela abre — pendurar no index.html faria toda sessão
// baixar três famílias para uma tela que a maioria dos papéis nem vê.
const FONTES = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'

function useFontesDoRelatorio() {
  useEffect(() => {
    // Uma tag só, ainda que a tela remonte: a folha fica no <head> depois da
    // primeira visita, e rebaixá-la a cada volta piscaria o texto.
    if (document.querySelector('link[data-fontes="relatorio"]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONTES
    link.dataset.fontes = 'relatorio'
    document.head.appendChild(link)
  }, [])
}

// Realce do índice lateral conforme a leitura avança: a seção visível marca o
// seu item. É a única parte do script do documento original que continua fazendo
// falta aqui (o botão de tema virou o tema do app; o de imprimir, ação do topo).
function useIndiceAtivo(raiz: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.toc a'))
    const alvos = links.map((a) => {
      const href = a.getAttribute('href') ?? ''
      // querySelector dentro do container: o documento é injetado aqui, e ids
      // iguais aos de outra tela não devem ser alcançados.
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
        links[i].style.borderLeftColor = 'var(--gold)'
        links[i].style.color = 'var(--ink)'
      }
    }, { rootMargin: '-10% 0px -80% 0px' })

    for (const alvo of alvos) if (alvo) obs.observe(alvo)
    return () => obs.disconnect()
  }, [raiz])
}

// Navegação entre seções por âncora. O documento usa href="#id", que o
// react-router interpretaria como rota; então o clique é tratado aqui e vira
// rolagem até o alvo, sem mexer na URL da aplicação.
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

export default function Relatorio() {
  const raiz = useRef<HTMLDivElement>(null)
  useFontesDoRelatorio()
  useIndiceAtivo(raiz)
  useAncorasInternas(raiz)

  usePageHeader(useMemo(() => ({
    title: 'Relatório',
    subtitle: 'Auditoria geral do sistema B+',
    actions: (
      <button type="button" className="btn btn-outline" onClick={() => window.print()}>
        Imprimir ou salvar em PDF
      </button>
    ),
  }), []))

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
