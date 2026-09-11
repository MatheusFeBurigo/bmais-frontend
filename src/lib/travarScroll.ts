// Trava o scroll da página enquanto uma camada sobreposta (modal/drawer) está
// aberta: sem isso, a roda do mouse sobre o backdrop rola o conteúdo de trás e
// a tela "escapa" por baixo da camada.
//
// A barra de rolagem some ao fixar overflow:hidden e o layout salta a largura
// dela; compensamos com padding-right equivalente. O contador permite camadas
// empilhadas (drawer que abre modal) — só a última a fechar destrava.
import { useEffect } from 'react'

let travas = 0
let paddingAnterior = ''
let overflowAnterior = ''

/** Trava o scroll do body enquanto `ativo` — destrava ao desmontar. */
export function useTravarScroll(ativo = true) {
  useEffect(() => {
    if (!ativo) return
    const body = document.body
    if (travas === 0) {
      overflowAnterior = body.style.overflow
      paddingAnterior = body.style.paddingRight
      const larguraBarra = window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (larguraBarra > 0) body.style.paddingRight = `${larguraBarra}px`
    }
    travas += 1
    return () => {
      travas -= 1
      if (travas === 0) {
        body.style.overflow = overflowAnterior
        body.style.paddingRight = paddingAnterior
      }
    }
  }, [ativo])
}
