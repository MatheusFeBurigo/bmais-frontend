// Render diferido: pinta o essencial da tela primeiro e monta os blocos pesados
// (gráficos Chart.js, tabelas grandes) logo depois do primeiro paint. O payload
// da API chega inteiro, mas o CUSTO DE RENDER dos gráficos é o que trava a tela —
// adiá-lo por um tick faz o cliente ver KPIs/topo instantaneamente.

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Retorna false no primeiro paint e true logo depois (via rAF duplo). Permite
 * renderizar um placeholder leve antes e o conteúdo pesado em seguida, sem
 * bloquear a primeira pintura. Cada chamada é independente, então blocos podem
 * escalonar sua entrada passando `delaySteps` diferentes.
 */
export function useDeferredRender(delaySteps = 1): boolean {
  const [pronto, setPronto] = useState(false)
  useEffect(() => {
    let raf1 = 0
    let raf2 = 0
    let restantes = Math.max(1, delaySteps)
    const tick = () => {
      restantes -= 1
      if (restantes <= 0) {
        setPronto(true)
        return
      }
      raf2 = requestAnimationFrame(tick)
    }
    raf1 = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [delaySteps])
  return pronto
}

/**
 * Envolve um bloco pesado: mostra `placeholder` (reservando a mesma altura para
 * não causar salto de layout) até o primeiro paint terminar, então monta o
 * conteúdo real. `minHeight` mantém o espaço reservado enquanto adia.
 */
export function Deferred({
  children,
  placeholder,
  delaySteps = 1,
  minHeight,
}: {
  children: ReactNode
  placeholder?: ReactNode
  delaySteps?: number
  minHeight?: number | string
}) {
  const pronto = useDeferredRender(delaySteps)
  if (pronto) return <>{children}</>
  return (
    <div style={minHeight != null ? { minHeight } : undefined} aria-busy="true">
      {placeholder}
    </div>
  )
}
